# Pre-requisite: git-lfs if you encounter error: "This repository is configured for Git LFS..."
# Run this command: sudo apt install git-lfs
git for-each-ref --sort=-committerdate --format="%(refname:short) %(committerdate:unix)" refs/remotes/ | awk -v two_weeks_ago=$(date -d '2 weeks ago' +%s) '$2 <= two_weeks_ago {print $1}' | while read branch; do
    remote_branch=$(echo $branch | sed 's#^origin/##')
    protected_branches=("main" "develop" "architecture/mission_action")
    if [[ ! " ${protected_branches[@]} " =~ " ${remote_branch} " ]]; then
        echo "deleting branch "$remote_branch"..."
        git push origin --delete "$remote_branch" 2>/dev/null
    fi
done
