import flask
from flask import current_app, render_template, redirect, url_for, flash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired

from profile_app.models import User, db
from control.models import Class, RequestsToClass, Group

from project.email import send_confirmation_email

from registration import registration


def show_page_registration():
    if flask.request.method == 'POST':
        print(flask.request.json)
        name = flask.request.json['name']
        email = flask.request.json['email']
        password = flask.request.json['passw']
        group_id = flask.request.json['groupId']

        if User.query.filter_by(email=email).first():
            flash('Користувач з такою електронною поштою вже існує.', 'error')
            return redirect(url_for('registration.show_page_registration'))
        if group_id:
            user_data = {
                'name': name,
                'email': email,
                'password': password,
                'is_teacher': 0,
                'group': group_id,
            }
        else: 
           user_data = {
                'name': name,
                'email': email,
                'password': password,
                'is_teacher': 0,
            }
        s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        token = s.dumps(user_data, salt='email-confirm')
        
        send_confirmation_email(user_data['email'], token)

        # flash('На вашу електронну пошту надіслано посилання для підтвердження.', 'success')
        return {"success": True}
    
    groups = Class.query.all()
    context={
        "groups": groups
    }
    # classes = Class.query.order_by(Class.name).all()
    return render_template('registration.html', **context)


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
        new_user = User(
            name=user_data.get('name'),
            email=user_data.get('email'),
            password=user_data.get('password'),
            is_teacher=user_data.get('is_teacher', False),
            is_approved=False, 
        )

        db.session.add(new_user)
        db.session.flush()
        
        resp = flask.make_response(redirect(url_for('registration.get_group')))
        resp.set_cookie('group', 'none')
        resp.set_cookie('user_id', new_user.id)
        return 


    except Exception as e:
        db.session.rollback()
        print(f"Error in email confirmation: {e}")
        flash('Сталася помилка під час активації облікового запису.', 'error')
        return redirect(url_for('registration.show_page_registration'))
    
def get_group():
    if flask.request.method == 'POST':
        group =flask.request.cookies.get('group')
        user_id = flask.request.cookies.get('user_id')
        usr = User.query.get(id=user_id)
        if usr:
            if group != "none":
                grp = Class.query.filter_by(name=group)
        

        else:
            print("else")
            return redirect(url_for('authorization.show_authorization'))

