document.addEventListener('DOMContentLoaded', async () => {
    //Make sure firebase is loaded
    if (!window.db || !window.firestoreExports) {
      setTimeout(arguments.callee, 100);
      return;
    }
    // Get the entry data from the database
    const db = window.db;
    const scoreboardList = document.getElementById('scoreboardList');
    scoreboardList.innerHTML = "<li>Loading...</li>";
    const { getDocs, collection } = window.firestoreExports;
    const collections = ["movies", "tvShows", "videoGames"];
    const userCounts = {};
  
    // Go through each entry and count likes/dislikes for each user
    for (const col of collections) {
      const snap = await getDocs(collection(db, col));
      snap.forEach(docSnap => {
        const data = docSnap.data();
        (data.likedBy || []).forEach(username => {
          if (!userCounts[username]) userCounts[username] = { likes: 0, dislikes: 0, total: 0 };
          userCounts[username].likes += 1;
          userCounts[username].total += 1;
        });
        (data.dislikedBy || []).forEach(username => {
          if (!userCounts[username]) userCounts[username] = { likes: 0, dislikes: 0, total: 0 };
          userCounts[username].dislikes += 1;
          userCounts[username].total += 1;
        });
      });
    }
  
    // Convert to array and sort by total reviews (likes+dislikes)
    const sortedUsers = Object.entries(userCounts)
      .sort((a, b) => b[1].total - a[1].total);
  
    scoreboardList.innerHTML = "";
    // Display the sorted list of users or a message if no reviews exist yet
    if (sortedUsers.length === 0) {
      scoreboardList.innerHTML = "<li>No reviews yet.</li>";
    } else {
      sortedUsers.forEach(([username, stats], idx) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${idx + 1}. ${username}</strong>
          <span style="float:right">
            Likes/Dislikes: ${stats.total}
          </span>
        `;
        scoreboardList.appendChild(li);
      });
    }
  });