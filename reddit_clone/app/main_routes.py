from flask import Blueprint, render_template

bp = Blueprint('main', __name__)

@bp.route('/')
@bp.route('/index')
def index():
    # For now, just a placeholder. Later we'll display posts.
    return "Hello, World! This will be the home page."
