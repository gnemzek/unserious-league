const SCHEDULE_CONTAINER = document.getElementById('schedule-container');
const STANDINGS_BODY = document.getElementById('standings-tbody');
const MODAL_CONTAINER = document.getElementById('modals-container');

function displaySchedule() {
    if (!SCHEDULE_CONTAINER) return;
    SCHEDULE_CONTAINER.innerHTML = ''; // Clear container

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const teamLookup = {};
    teamsData.forEach(team => {
        teamLookup[team.name] = {
            logo: team.logo,
            record: `${team.wonGames}-${team.lostGames}`,
            roster: team.roster,
            cleanName: team.name.replace(/[^a-zA-Z0-9]/g, '') // For modal IDs
        };

        let modalHtml = `
            <div class="modal fade" id="${teamLookup[team.name].cleanName}-modal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" data-bs-theme="dark">
            <div class="modal-dialog">
                <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="exampleModalLabel">${team.name}</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="card">
                         <div class="card-body">
                            <p><strong>Record:</strong> ${team.wonGames}-${team.lostGames}</p>
                            <p><strong>Roster:</strong></p>
                            <ul>
                                ${team.roster.map(player => `<li>${player}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
                </div>
            </div>
            </div>
        `
        MODAL_CONTAINER.innerHTML += modalHtml;
    });

    const groupedGames = {};

    data.forEach(game => {
        if (!groupedGames[game.date]) {
            groupedGames[game.date] = [];
        }
        groupedGames[game.date].push(game);
    });

    // SPLIT DATES INTO PAST AND FUTURE GROUPS 
    const uniqueDates = Object.keys(groupedGames);
    const upcomingDates = [];
    const pastDates = [];

    uniqueDates.forEach(dateString => {
        const targetDate = new Date(dateString + 'T00:00:00'); // Standard parse

        if (targetDate < todayMidnight) {
            pastDates.push(dateString);
        } else {
            upcomingDates.push(dateString);
        }
    });

    // Sort upcoming dates from soonest to farthest (chronological)
    upcomingDates.sort();

    // Sort past dates from most recent to oldest (reverse chronological)
    pastDates.sort((a, b) => b.localeCompare(a));

    // RENDER UPCOMING DAYS AT THE TOP ───
    upcomingDates.forEach(dateString => {
        renderDaySection(dateString, groupedGames[dateString], teamLookup, false); // false = not muted day
    });

    // Add a visual separator if you have both types of games
    if (upcomingDates.length > 0 && pastDates.length > 0) {
        SCHEDULE_CONTAINER.innerHTML += `
            <div class="text-center my-2">
                <h2 class="past-games">Past Games</h2>
            </div>
        `;
    }

    // RENDER PAST DAYS AT THE BOTTOM (MUTED)
    pastDates.forEach(dateString => {
        renderDaySection(dateString, groupedGames[dateString], teamLookup, true); // true = muted day
    });

    function renderDaySection(dateString, games, teamLookup, isMutedDay) {
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        const formattedDate = new Date(dateString).toLocaleDateString('en-US', dateOptions);

        const daySection = document.createElement('div');
        daySection.className = isMutedDay ? 'day-section mb-4 opacity-75' : 'day-section mb-4';

        const headerClass = isMutedDay ? 'text-secondary fs-5 border-bottom pb-1' : 'text-primary border-bottom pb-2';
        daySection.innerHTML = `<h3 class="day-header ${headerClass}">${formattedDate}</h3>`;

        // 💡 Performance Fix: Accumulate all game strings first!
        let gamesHtmlBuffer = '';

        games.forEach(game => {
            const awayLogo = teamLookup[game.awayTeam]?.logo || '🏀'; // Fallback for TBD games
            const homeLogo = teamLookup[game.homeTeam]?.logo || '🏀';
            const awayRecord = teamLookup[game.awayTeam]?.record || '0-0';
            const homeRecord = teamLookup[game.homeTeam]?.record || '0-0';

            const gameDateTime = new Date(`${game.date} ${game.time}`);
            const isPastGame = gameDateTime < new Date();

            // Accumulate strings smoothly in memory instead of touching innerHTML repeatedly
            gamesHtmlBuffer += createGameCardHtml(game, isPastGame, awayLogo, homeLogo, awayRecord, homeRecord);
        });

        // 💡 Push it to the DOM exactly ONCE per day section
        daySection.innerHTML += gamesHtmlBuffer;
        SCHEDULE_CONTAINER.appendChild(daySection);
    }


}

function createGameCardHtml(game, isPast, awayLogo, homeLogo, awayRecord, homeRecord) {
    const homeName = game.homeTeam;
    const cleanHomeName = homeName.replace(/[^a-zA-Z0-9]/g, ''); // For modal IDs
    const awayName = game.awayTeam;
    const cleanAwayName = awayName.replace(/[^a-zA-Z0-9]/g, ''); // For modal IDs
    const date = game.date;
    const time = game.time;
    const type = game.type;
    const winner = game.winner;


    const gameCard = document.createElement('div');
    const cardClass = isPast ? 'game-card past' : 'game-card';

    // checking to see if there are scores - the first few games don't have scores. If there are no scores, they won't show
    const hasScores = game.awayScore !== undefined && game.homeScore !== undefined;

    let homeWin = false;
    let awayWin = false;

    let playoffs = false

    if (homeName === winner) {
        homeWin = true;
    }

    if (awayName === winner) {
        awayWin = true;
    }

    if (game.type === 'playoffs') {
        playoffs = true;
    }


    return `
        <div class="${cardClass} my-2">
            <div class="game-card-inner-wrapper row align-items-center game-${type}">
             ${playoffs ? `<span class="playoffs badge text-bg-light">Playoffs!</span>` : ''}
                <div class="team visitor col-md-4">
                    <button type="button" class="team-modal-btn" data-bs-toggle="modal" data-bs-target="#${cleanAwayName}-modal"><span class="team-name"> <span class="team-logo">${awayLogo}</span> ${awayName} <span class="team-logo">${awayLogo}</span></span> </button>
                    ${awayWin ? `<div class="winner-tag badge text-bg-light">Winner!</div>` : ''}
                      <small class="text-muted">(${awayRecord})</small>
                      ${hasScores ? `<span class="score">${game.awayScore}</span>` : ''}
                </div>
                <div class="vs-container col-md-2 text-center">
                    <div class="vs">@</div>
                </div>
                <div class="team home col-md-4">
                
                    <button type="button" class="team-modal-btn" data-bs-toggle="modal" data-bs-target="#${cleanHomeName}-modal"> <span class="team-name"> <span class="team-logo">${homeLogo}</span> ${homeName} <span class="team-logo">${homeLogo}</span></span> </button>
                    ${homeWin ? `<div class="winner-tag badge text-bg-light">Winner!</div>` : ''}  
                    <small class="text-muted">(${homeRecord})</small>
                      ${hasScores ? `<span class="score">${game.homeScore}</span>` : ''}
                </div>
                <div class="game-info col-md-2">${time}</div>
            </div>
        </div>
    `;
}


function displayStandings() {
    if (!STANDINGS_BODY) return;
    STANDINGS_BODY.innerHTML = ''; // Reset table body

    // Map and clone teams data so we don't overwrite original list values
    const standingsList = teamsData.map(team => {
        const wins = parseInt(team.wonGames) || 0;
        const losses = parseInt(team.lostGames) || 0;
        const totalGames = wins + losses;

        // Calculate win percentage (handle division by zero if league hasn't started)
        const winPercentage = totalGames > 0 ? (wins / totalGames) : 0;

        return {
            name: team.name,
            logo: team.logo,
            wins: wins,
            losses: losses,
            winPct: winPercentage
        };
    });

    // Sort teams: Highest win percentage first. 
    // If tied, sort by most total wins.
    standingsList.sort((a, b) => {
        if (b.winPct !== a.winPct) {
            return b.winPct - a.winPct;
        }
        return b.wins - a.wins;
    });

    // Render the sorted list rows into your HTML table framework
    standingsList.forEach((team, index) => {
        // Format win percentage to a clean 3-digit decimal string (e.g., .750 or .500)
        const formattedPct = team.winPct.toFixed(3).replace(/^0/, '');

        const row = document.createElement('tr');
        row.innerHTML = `
            <th scope="row" class="fw-bold text-secondary">${index + 1}</th>
            <td>
                <div class="d-flex align-items-center">
                    <span class="fw-bold"> <span class="team-logo">${team.logo}</span> ${team.name} <span class="team-logo">${team.logo}</span></span>
                </div>
            </td>
            <td class="text-center fw-bold">${team.wins}</td>
            <td class="text-center text-muted">${team.losses}</td>
        `;
        STANDINGS_BODY.appendChild(row);
    });
}

displaySchedule();
displayStandings();

const statsEngine = {};
teamsData.forEach(team => {
    statsEngine[team.name] = {
        name: team.name,
        displayName: `${team.logo} ${team.name}`,
        wins: 0,
        losses: 0,
        ptsScored: 0,
        ptsAllowed: 0,
        differential: 0
    };
});

data.forEach(game => {
    if (game.type === "regular") {
        // Calculate Wins & Losses
        if (game.winner) {
            statsEngine[game.winner].wins++;
            const loser = game.winner === game.homeTeam ? game.awayTeam : game.homeTeam;
            if (statsEngine[loser]) statsEngine[loser].losses++;
        }
        // Calculate Points Metrics
        if (game.homeScore !== undefined && game.awayScore !== undefined) {
            if (statsEngine[game.homeTeam]) {
                statsEngine[game.homeTeam].ptsScored += game.homeScore;
                statsEngine[game.homeTeam].ptsAllowed += game.awayScore;
            }
            if (statsEngine[game.awayTeam]) {
                statsEngine[game.awayTeam].ptsScored += game.awayScore;
                statsEngine[game.awayTeam].ptsAllowed += game.homeScore;
            }
        }
    }
});

// Post-process calculations & sort by win hierarchy
const processedTeams = Object.values(statsEngine).map(team => {
    team.differential = team.ptsScored - team.ptsAllowed;
    return team;
}).sort((a, b) => b.wins - a.wins || a.losses - b.losses);

// Extract Arrays for Chart.js
// Arrays for Standings & Points charts (Sorted by Wins/Losses)
const labels = processedTeams.map(t => t.displayName);
const winsData = processedTeams.map(t => t.wins);
const lossesData = processedTeams.map(t => t.losses);
const scoredData = processedTeams.map(t => t.ptsScored);
const allowedData = processedTeams.map(t => t.ptsAllowed);

//Create a separate array sorted by Point Differential (Highest to Lowest)
const diffSortedTeams = [...processedTeams].sort((a, b) => b.differential - a.differential);

// Extract separate arrays specifically for Chart 3
const diffLabels = diffSortedTeams.map(t => t.displayName);
const diffData = diffSortedTeams.map(t => t.differential);

document.addEventListener("DOMContentLoaded", () => {
    // Put ALL Chart.js instantiation logic inside here:

    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.devicePixelRatio = window.devicePixelRatio || 1;

    // Chart 1: Standings
    new Chart(document.getElementById('standingsChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Wins', data: winsData, backgroundColor: '#591a7e' },
                { label: 'Losses', data: lossesData, backgroundColor: '#5dc3ec' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 50, // 💡 Debounces the window resizer so it won't trigger infinite loops
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Chart 2: Points Comparison
    new Chart(document.getElementById('pointsChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Points Scored', data: scoredData, backgroundColor: '#1f77b4' },
                { label: 'Points Allowed', data: allowedData, backgroundColor: '#ff7f0e' }
            ]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    // Chart 3: Point Differential
    new Chart(document.getElementById('differentialChart'), {
        type: 'bar',
        data: {
            labels: diffLabels,
            datasets: [{
                label: 'Net Differential',
                data: diffData,
                // 💡 Force a solid border color even if height is 0
                backgroundColor: diffData.map(v => {
                    if (v === 0) return 'rgba(108, 117, 125, 0.2)'; // Muted gray for 0
                    return v > 0 ? 'rgba(31, 119, 180, 0.7)' : 'rgba(227, 119, 194, 0.7)';
                }),
                borderColor: diffData.map(v => {
                    if (v === 0) return '#6c757d'; // Solid gray border line for 0
                    return v > 0 ? '#1f77b4' : '#e377c2';
                }),
                borderWidth: 2, // Thicken the border slightly so the 0 line stands out
                minBarLength: 6 // 💡 The Secret Sauce: Forces a 6px mini-bar to render if data is 0!
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 100,
            scales: {
                y: {
                    beginAtZero: true,
                    // Add padding so data labels at the top aren't cut off
                    grace: '10%'
                }
            },
            plugins: {
                // Adds clear layout formatting to the popup text box when hovering
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let val = context.raw;
                            if (val === 0) return ' Net Differential: Even (0)';
                            return val > 0 ? ` Net Differential: +${val}` : ` Net Differential: ${val}`;
                        }
                    }
                }
            }
        }
    });
});
