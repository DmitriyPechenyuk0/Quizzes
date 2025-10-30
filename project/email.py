from flask import url_for
from flask_mail import Message
from .settings import mail 

def send_confirmation_email(user_email, token):
    """Sends the email confirmation link to the new user."""
    confirm_url = url_for('registration.confirm_email', token=token, _external=True)
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

def send_student_approval_email(student_email, teacher_name, class_name):
    """Sends a notification to the student after a teacher approves their request."""
    html_body = f"""
        <h3>Вас прийнято до класу!</h3>
        <p>Вітаємо!</p>
        <p>Вчитель <b>{teacher_name}</b> прийняв ваш запит на вступ до класу <b>"{class_name}"</b>.</p>
        <p>Тепер ви можете увійти до свого облікового запису та отримати доступ до матеріалів курсу.</p>
    """
    msg = Message(
        'Запит на вступ до класу прийнято',
        recipients=[student_email],
        html=html_body
    )
    mail.send(msg)