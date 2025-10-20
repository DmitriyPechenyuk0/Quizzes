import project


if __name__ == '__main__':
    project.socketio.run(project.project, debug=True, port=5001)