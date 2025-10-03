import flask
from profile_app.models import User, db
from project.settings import mail
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
from flask import current_app
from registration import registration


def send_confirmation_email(user_email, token):
    confirm_url = flask.url_for('registration.confirm_email', token=token, _external=True)

 
    html_body = f"""
        <h3>Підтвердження реєстрації</h3>
        <p>Дякуємо за реєстрацію! Будь ласка, перейдіть за посиланням нижче, щоб активувати ваш обліковий запис.</p>
        <p><a href="{confirm_url}">{confirm_url}</a></p>
        <p><small>Якщо ви не реєструвалися, просто проігноруйте цей лист.</small></p>
    """


    msg = Message(
        'Підтвердження реєстрації',
        recipients=[user_email],
        html=html_body  
    )
    mail.send(msg)



def show_page_registration():
    context = {'page': 'home'}
    if flask.request.method == 'POST':
        if User.query.filter_by(email=flask.request.form['email']).first():
            flask.flash('Користувач з такою електронною поштою вже існує.', 'error')
            return flask.redirect(flask.url_for('registration.show_page_registration'))
        
        user_data = {
            'name': flask.request.form['login'],
            'email': flask.request.form['email'],
            'password': flask.request.form['password'],
            'is_admin': bool(int(flask.request.form['Teacher']))
        }

        s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        token = s.dumps(user_data, salt='email-confirm')

        send_confirmation_email(user_data['email'], token)

        flask.flash('На вашу електронну пошту надіслано посилання для підтвердження.', 'success')
        return flask.redirect(flask.url_for('registration.show_page_registration'))

    return flask.render_template(template_name_or_list='registration.html', **context)

def confirm_email(token):
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        user_data = s.loads(token, salt='email-confirm', max_age=3600)
    except SignatureExpired:
        return '<h1>Термін дії посилання закінчився.</h1>'
    except Exception as e:
        return f'<h1>Помилка: {e}. Посилання недійсне або пошкоджене.</h1>'

    if User.query.filter_by(email=user_data['email']).first():
         return '<h1>Ця електронна пошта вже підтверджена.</h1>'
    
    user = User(
        name=user_data['name'],
        email=user_data['email'],
        password=user_data['password'],
        is_admin=user_data['is_admin'],
        is_confirmed=True
    )
    
    try:
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        print(e)
        return '<h1>Сталася помилка під час створення користувача.</h1>'

    return flask.redirect("/login")

registration.add_url_rule('/registration', view_func=show_page_registration, methods=['GET', 'POST'])
registration.add_url_rule('/accept/<token>', view_func=confirm_email, methods=['GET'])