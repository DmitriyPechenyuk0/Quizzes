from flask import Blueprint, request, render_template, redirect
from profile_app.models import User, db

registration_bp = Blueprint('registration', __name__, template_folder='templates')

@registration_bp.route('/register', methods=['GET', 'POST'])
def show_page_registration():
    context = {'page': 'home'}

    if request.method == 'POST':
        login = request.form['login']
        email = request.form['email']
        password = request.form['password']
        confirm = request.form['confirm']
        is_teacher = bool(int(request.form['Teacher']))
        group = request.form.get('group')

        
        if password != confirm:
            context['error'] = "Passwords do not match"
            return render_template('registration.html', **context)

    
        if not group:
            context['error'] = "Please select your group"
            return render_template('registration.html', **context)
        group = int(group)

        user = User(
            name=login,
            email=email,
            password=password,
            is_teacher=is_teacher,
            group=group
        )

        try:
            db.session.add(user)
            db.session.commit()
            return redirect("/login")
        except Exception as e:
            print(e)
            context['error'] = "Failed to register user"

    return render_template('registration.html', **context)
