from flask import Blueprint

bp = Blueprint('communities', __name__, template_folder='templates')

from app.communities import routes # noqa
