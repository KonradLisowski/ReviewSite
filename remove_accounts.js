document.addEventListener('DOMContentLoaded', async () => {
    // Make sure firebase is loaded
    if (!window.db || !window.firestoreExports) {
      setTimeout(arguments.callee, 100);
      return;
    }
    const db = window.db;
    const { getDocs, collection, deleteDoc, doc, query, where, updateDoc } = window.firestoreExports;
    const userList = document.getElementById('userList');
    const searchInput = document.getElementById('searchInput');
    // Loads and displays users from the database, also allows searching by username
    async function loadUsers(filter = "") {
      userList.innerHTML = "<li>Loading...</li>";
      const usersSnapshot = await getDocs(collection(db, "users"));
      userList.innerHTML = "";
      usersSnapshot.forEach(userDoc => {
        const user = userDoc.data();
        if (user.username.toLowerCase().includes(filter.toLowerCase())) {
          const li = document.createElement('li');
          li.innerHTML = `
            <span><strong>${user.username}</strong></span>
            <button class="delete-button" style="float:right" onclick="removeUser('${userDoc.id}', '${user.username}')">Remove</button>
          `;
          userList.appendChild(li);
        }
      });
      if (!userList.hasChildNodes()) {
        userList.innerHTML = "<li>No users found.</li>";
      }
    }
  
    window.removeUser = async function(userId, username) {
      if (!confirm(`Are you sure you want to remove user "${username}" and all their data?`)) return;
  
      try {
        // Delete user document
        await deleteDoc(doc(db, "users", userId));
  
        // Delete user preferences
        await deleteDoc(doc(db, "userPreferences", username));
  
        // Delete user likes that is used in scoreboard
        const userLikesQuery = query(collection(db, "userLikes"), where("username", "==", username));
        const userLikesSnap = await getDocs(userLikesQuery);
        for (const likeDoc of userLikesSnap.docs) {
          await deleteDoc(likeDoc.ref);
        }
  
        // For all entries, remove user from likes and dislikes and delete their comments
        const collections = ["movies", "tvShows", "videoGames"];
        for (const col of collections) {
          const itemsSnap = await getDocs(collection(db, col));
          for (const itemDoc of itemsSnap.docs) {
            const itemData = itemDoc.data();
            let changed = false;
  
            // Ensure arrays exist
            itemData.likedBy = Array.isArray(itemData.likedBy) ? itemData.likedBy : [];
            itemData.dislikedBy = Array.isArray(itemData.dislikedBy) ? itemData.dislikedBy : [];
  
            // Remove from likedBy
            const oldLikedBy = [...itemData.likedBy];
            itemData.likedBy = itemData.likedBy.filter(u => u.trim().toLowerCase() !== username.trim().toLowerCase());
            if (itemData.likedBy.length !== oldLikedBy.length) changed = true;
  
            // Remove from dislikedBy
            const oldDislikedBy = [...itemData.dislikedBy];
            itemData.dislikedBy = itemData.dislikedBy.filter(u => u.trim().toLowerCase() !== username.trim().toLowerCase());
            if (itemData.dislikedBy.length !== oldDislikedBy.length) changed = true;
  
            // Update likes/dislikes counts and Firestore
            if (changed) {
              itemData.likes = itemData.likedBy.length;
              itemData.dislikes = itemData.dislikedBy.length;
              await updateDoc(doc(db, col, itemDoc.id), {
                likedBy: itemData.likedBy,
                dislikedBy: itemData.dislikedBy,
                likes: itemData.likes,
                dislikes: itemData.dislikes
              });
            }
  
            // Delete comments made by the user deleted
            const commentsSnap = await getDocs(collection(db, `${col}/${itemDoc.id}/comments`));
            for (const commentDoc of commentsSnap.docs) {
              if (commentDoc.data().username && commentDoc.data().username.trim().toLowerCase() === username.trim().toLowerCase()) {
                await deleteDoc(commentDoc.ref);
              }
            }
          }
        }
        // notify the admin of success or failure of the user removal
        alert(`User "${username}" and all their data removed.`);
        loadUsers(searchInput.value);
      } catch (error) {
        console.error("Error removing user:", error);
        alert("An error occurred while removing the user. Please try again.");
      }
    };
    //set up search filter and load list of users
    searchInput.addEventListener('input', () => loadUsers(searchInput.value));
    loadUsers();
  });