import flask
from flask import current_app, render_template, redirect, url_for, flash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired

from profile_app.models import User, db
from control.moduls import Class, RequestsToClass

from project.email import send_confirmation_email

from registration import registration


def show_page_registration():
    if flask.request.method == 'POST':
        login = flask.request.form.get('login')
        email = flask.request.form.get('email')
        password = flask.request.form.get('password')
        confirm = flask.request.form.get('confirm')
        _teacher_val = flask.request.form.get('Teacher')
        is_teacher = bool(_teacher_val and str(_teacher_val).lower() in ('1', 'true', 'on', 'yes'))
        group = flask.request.form.get('group')

        if User.query.filter_by(email=email).first():
            flash('Користувач з такою електронною поштою вже існує.', 'error')
            return redirect(url_for('registration.show_page_registration'))

        if login and User.query.filter_by(name=login).first():
            flash('Користувач з таким логіном вже існує.', 'error')
            return redirect(url_for('registration.show_page_registration'))

        if password != confirm:
            flash('Паролі не співпадають', 'error')
            return redirect(url_for('registration.show_page_registration'))

        if not group:
            flash('Будь ласка, виберіть ваш клас', 'error')
            return redirect(url_for('registration.show_page_registration'))

        user_data = {
            'name': login,
            'email': email,
            'password': password,
            'is_teacher': is_teacher,
            'group': group,
            'group_name': group,
        }
        
        s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        token = s.dumps(user_data, salt='email-confirm')
        
        send_confirmation_email(user_data['email'], token)

        flash('На вашу електронну пошту надіслано посилання для підтвердження.', 'success')
        return redirect(url_for('registration.show_page_registration'))

    classes = Class.query.order_by(Class.name).all()
    return render_template('registration.html', classes=classes, show_class_selector=True)


def confirm_email(token):
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        user_data = s.loads(token, salt='email-confirm', max_age=3600)
    except SignatureExpired:
        flash('Термін дії посилання закінчився. Будь ласка, зареєструйтеся знову.', 'error')
        return redirect(url_for('registration.show_page_registration'))
    except Exception:
        flash('Посилання недійсне або пошкоджене.', 'error')
        return redirect(url_for('registration.show_page_registration'))

    if User.query.filter_by(email=user_data['email']).first():
        flash('Ця електронна пошта вже підтверджена. Будь ласка, увійдіть.', 'success')
        return redirect(url_for('authorization.show_authorization'))

    try:
        group_raw = user_data.get('group_name')

        if group_raw:
            
            target_class = Class.query.filter_by(name=group_raw).first()

            if target_class:
                new_user = User(
                    name=user_data.get('name'),
                    email=user_data.get('email'),
                    password=user_data.get('password'),
                    is_teacher=user_data.get('is_teacher', False),
                    # is_email_confirmed=True,
                    is_approved=True, 
                )

                request_obj = RequestsToClass(
                    user_id=new_user.id,
                    class_id=target_class.id,
                    status='Pending'
                )

                db.session.add(request_obj)
                db.session.commit()
            else:
                db.session.rollback()
                flash('Клас з таким номером не існує.', 'error')
                return redirect(url_for('registration.show_page_registration'))
        else:
            return redirect(url_for('registration.show_page_registration'))
        
        db.session.add(new_user)
        db.session.commit()

        flash('Ваш обліковий запис успішно підтверджено! Тепер ви можете увійти.', 'success')
        return redirect(url_for('authorization.show_authorization'))

    except Exception as e:
        db.session.rollback()
        print(f"Error in email confirmation: {e}")
        flash('Сталася помилка під час активації облікового запису.', 'error')
        return redirect(url_for('registration.show_page_registration'))