const SCHEDULE_CONTAINER = document.getElementById('schedule-container');
const STANDINGS_BODY = document.getElementById('standings-tbody');

function displaySchedule() {
    if (!SCHEDULE_CONTAINER) return;
    SCHEDULE_CONTAINER.innerHTML = ''; // Clear container

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const teamLookup = {};
    teamsData.forEach(team => {
        teamLookup[team.name] = {
            logo: team.logo,
            record: `${team.wonGames}-${team.lostGames}`
        };
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
                <span class="badge bg-dark px-3 py-2">Past Games</span>
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

        // Add the "opacity-50" Bootstrap class if the whole day has passed
        daySection.className = isMutedDay ? 'day-section mb-4 opacity-50' : 'day-section mb-4';

        // Header style changes based on whether it is past or upcoming
        const headerClass = isMutedDay ? 'text-secondary fs-5 border-bottom pb-1' : 'text-primary border-bottom pb-2';
        daySection.innerHTML = `<h3 class="day-header ${headerClass}">${formattedDate} ${isMutedDay ? '(Finished)' : ''}</h3>`;

        // Render individual cards inside this day
        games.forEach(game => {
            const awayLogo = teamLookup[game.awayTeam]?.logo || '';
            const homeLogo = teamLookup[game.homeTeam]?.logo || '';
            const awayRecord = teamLookup[game.awayTeam]?.record || '0-0';
            const homeRecord = teamLookup[game.homeTeam]?.record || '0-0';

            // Match individual game status
            const gameDateTime = new Date(`${game.date} ${game.time}`);
            const isPastGame = gameDateTime < new Date();

            daySection.innerHTML += createGameCardHtml(game, isPastGame, awayLogo, homeLogo, awayRecord, homeRecord);
        });

        SCHEDULE_CONTAINER.appendChild(daySection);
    }


}

function createGameCardHtml(game, isPast, awayLogo, homeLogo, awayRecord, homeRecord) {
    const homeName = game.homeTeam;
    const awayName = game.awayTeam;
    const date = game.date;
    const time = game.time;
    const type = game.type;

    const gameCard = document.createElement('div');

    // Add the "past" CSS styling class if the game time has slipped by
    const cardClass = isPast ? 'game-card past' : 'game-card';

    return `
        <div class="${cardClass} my-2">
            <div class="game-card-inner-wrapper row align-items-center game-${type}">
                <div class="team visitor col-md-4">
                    <span class="team-name"> <span class="team-logo">${awayLogo}</span> ${awayName} <span class="team-logo">${awayLogo}</span></span> 
                      <small class="text-muted">(${awayRecord})</small>
                </div>
                <div class="vs-container col-md-2 text-center">
                    <div class="vs">@</div>
                </div>
                <div class="team home col-md-4">
                    <span class="team-name"> <span class="team-logo">${homeLogo}</span> ${homeName} <span class="team-logo">${homeLogo}</span></span>
                      <small class="text-muted">(${homeRecord})</small>
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

