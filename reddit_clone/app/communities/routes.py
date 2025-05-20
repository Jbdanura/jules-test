from flask import render_template, redirect, url_for, flash
from flask_login import login_required, current_user
from app import db
from app.communities import bp
from app.communities.forms import CreateCommunityForm
from app.models.community import Community
from app.models.user import User # Ensure User is imported

@bp.route('/create', methods=['GET', 'POST'])
@login_required
def create_community():
    form = CreateCommunityForm()
    if form.validate_on_submit():
        community = Community(name=form.name.data, 
                              description=form.description.data,
                              user_id=current_user.id)
        db.session.add(community)
        try:
            db.session.commit()
            flash('Community created successfully!', 'success')
            # Redirect to the new community's page (to be created) or home
            return redirect(url_for('main.index')) 
        except Exception as e:
            db.session.rollback()
            flash(f'Error creating community: {e}', 'danger')
    return render_template('communities/create_community.html', title='Create Community', form=form)

@bp.route('/')
def list_communities():
    # This will be the main page for listing communities, perhaps in a dedicated page
    # For the sidebar, we'll fetch this data differently or pass it to base.html context
    all_communities = Community.query.order_by(Community.name.asc()).all()
    return render_template('communities/list_communities.html', title='Communities', communities=all_communities)
