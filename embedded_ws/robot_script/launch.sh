MAIN_BRANCH="develop"
if [ -d ~/geppetto/ ]; then
    cd ~/geppetto/
    git switch $MAIN_BRANCH
    git pull
else
    cd ~
    git clone https://loic-hpp:glpat-v9Qt8vbw2zoY-stynsRH@gitlab.com/polytechnique-montr-al/inf3995/20243/equipe-107/geppetto.git
    cd ~/geppetto/
    git switch $MAIN_BRANCH
    git pull
fi

./launch_local.sh