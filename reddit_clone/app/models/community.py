from datetime import datetime
from app import db
from app.models.user import User # Ensure User is imported

class Community(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), index=True, unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) # Creator
    # Define relationship to User (creator)
    creator = db.relationship('User', backref=db.backref('created_communities', lazy='dynamic'))

    def __repr__(self):
        return f'<Community {self.name}>'
