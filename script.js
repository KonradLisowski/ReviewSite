// Import for firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// MY Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAl_IPTN38LLyW6rc-RIjXw_hZTDvRQhLI",
    authDomain: "reviewsite2-31100.firebaseapp.com",
    projectId: "reviewsite2-31100",
    storageBucket: "reviewsite2-31100.appspot.com",
    messagingSenderId: "824076074226",
    appId: "1:824076074226:web:7400ac69d1347f19ade46b",
    measurementId: "G-4RCSQR7C6Z"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const adminCredentials = { username: "Admin", password: "123" };

// Check if user is logged and load their information
let currentUser = null;
const storedUser = localStorage.getItem("currentUser");
if (storedUser) {
    currentUser = JSON.parse(storedUser);
}

// Show registration form
const showRegisterButton = document.getElementById('showRegister');
if (showRegisterButton) {
    showRegisterButton.addEventListener('click', () => {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('registerContainer').style.display = 'block';
    });
}

// Show login form
const showLoginButton = document.getElementById('showLogin');
if (showLoginButton) {
    showLoginButton.addEventListener('click', () => {
        document.getElementById('registerContainer').style.display = 'none';
        document.getElementById('authContainer').style.display = 'block';
    });
}

// Handle registration
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const userRef = collection(db, "users");
            const userQuery = query(userRef, where("username", "==", username));
            const querySnapshot = await getDocs(userQuery);

            if (!querySnapshot.empty) {
                alert('Username already exists!');
            } else {
                await addDoc(userRef, { username, password });

                // Initialize preferences for a new user
                await setDoc(doc(db, "userPreferences", username), {});

                alert('Registration successful! Please log in.');
                document.getElementById('registerContainer').style.display = 'none';
                document.getElementById('authContainer').style.display = 'block';
            }
        } catch (error) {
            console.error('Error registering user:', error);
        }
    });
}

// Handle login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === adminCredentials.username && password === adminCredentials.password) {
            currentUser = { username: "Admin", isAdmin: true };
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            window.location.href = "admin.html";
        } else {
            try {
                const userRef = collection(db, "users");
                const userQuery = query(userRef, where("username", "==", username), where("password", "==", password));
                const querySnapshot = await getDocs(userQuery);

                if (!querySnapshot.empty) {
                    currentUser = { username, isAdmin: false };
                    localStorage.setItem("currentUser", JSON.stringify(currentUser));
                    window.location.href = "user.html";
                } else {
                    alert('Invalid credentials!');
                }
            } catch (error) {
                console.error('Error logging in:', error);
            }
        }
    });
}

// Handle logout
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
    });
}

// Function to display movies
async function displayMovies() {
    const movieList = document.getElementById('movieList');
    if (!movieList) return;

    // Clear the list to stop duplicates from appearing
    clearList(movieList);

    const querySnapshot = await getDocs(collection(db, "movies"));
    querySnapshot.forEach((docSnap) => {
        const movie = docSnap.data();
        displayMovieItem(docSnap.id, movie, movieList);
    });
}
window.displayMovies = displayMovies;

// Function to add a comment
async function addComment(postId, collectionName) {
    if (!currentUser) return alert("You must be logged in.");
    const commentInput = document.getElementById(`commentInput-${collectionName}-${postId}`);
    if (!commentInput) return;
    const commentText = commentInput.value.trim();
    if (commentText) {
        try {
            await addDoc(collection(db, `${collectionName}/${postId}/comments`), {
                text: commentText,
                username: currentUser.username,
                timestamp: new Date()
            });
            commentInput.value = "";
            displayComments(postId, collectionName);
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    }
}
window.addComment = addComment;

// Function to display comments
async function displayComments(postId, collectionName) {
    const commentsList = document.getElementById(`comments-${collectionName}-${postId}`);
    if (!commentsList) return;

    const allComments = [];
    const querySnapshot = await getDocs(collection(db, `${collectionName}/${postId}/comments`));
    querySnapshot.forEach((docSnap) => {
        allComments.push({id: docSnap.id, ...docSnap.data()});
    });

    // Sort by newest first
    allComments.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());

    commentsList.innerHTML = "";

    // Show more or less comments for each users choice
    const userKey = currentUser ? currentUser.username : "guest";
    const toggleKey = `showAllComments-${userKey}-${collectionName}-${postId}`;
    const showAll = localStorage.getItem(toggleKey) === 'true';
    const commentsToShow = showAll ? allComments : allComments.slice(0, 3);
    // display list of comments
    commentsToShow.forEach(comment => {
        const li = document.createElement("li");
        li.innerHTML = `
            <p><span class="comment-username">${comment.username}:</span> <span class="comment-text">${comment.text}</span></p>
            ${currentUser && currentUser.username === comment.username ? `
                <button type="button" onclick="editComment('${postId}', '${collectionName}', '${comment.id}', this)">Edit</button>
                <button type="button" onclick="deleteComment('${postId}', '${collectionName}', '${comment.id}')">Delete</button>
            ` : currentUser && currentUser.isAdmin ? `
                <button type="button" onclick="deleteComment('${postId}', '${collectionName}', '${comment.id}')">Delete</button>
            ` : ""}
        `;
        commentsList.appendChild(li);
    });

    // Display "See More/Less" button if there are more than 3 comments
    if (allComments.length > 3) {
        const toggleButton = document.createElement("button");
        toggleButton.textContent = showAll ? "See Less" : "See More";
        toggleButton.onclick = () => {
            localStorage.setItem(toggleKey, !showAll);
            displayComments(postId, collectionName);
        };
        commentsList.appendChild(toggleButton);
    }
}

window.displayComments = displayComments;

// Function to delete a comment
async function deleteComment(postId, collectionName, commentId) {
    await deleteDoc(doc(db, `${collectionName}/${postId}/comments`, commentId));
    displayComments(postId, collectionName);
}
window.deleteComment = deleteComment;

// Handles a user's likes
async function likePost(postId, collectionName, event, isSearch = false) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (!currentUser) return alert("You must be logged in.");

    try {
        // Record the users likes
        await addDoc(collection(db, "userLikes"), {
            username: currentUser.username,
            itemId: postId,
            rating: 'like',
            timestamp: new Date()
        });

        // Update the like/dislike points for user preferences
        const postRef = doc(db, collectionName, postId);
        const postSnapshot = await getDoc(postRef);
        const post = postSnapshot.data();

        let dislikedBy = post.dislikedBy || [];
        let likedBy = post.likedBy || [];
        const wasPreviouslyDisliked = dislikedBy.includes(currentUser.username);
        const wasPreviouslyLiked = likedBy.includes(currentUser.username);

        let updateObj = {};

        if (wasPreviouslyDisliked) {
            dislikedBy = dislikedBy.filter(u => u !== currentUser.username);
            updateObj.dislikes = Math.max((post.dislikes || 0) - 1, 0);
            updateObj.dislikedBy = dislikedBy;

            if (!likedBy.includes(currentUser.username)) {
                likedBy.push(currentUser.username);
            }
            updateObj.likes = (post.likes || 0) + 1;
            updateObj.likedBy = likedBy;

            await updateUserPreferences(postId, collectionName, 'like');
            await updateUserPreferences(postId, collectionName, 'like');

        } else if (!wasPreviouslyLiked) {
            likedBy.push(currentUser.username);
            updateObj.likes = (post.likes || 0) + 1;
            updateObj.likedBy = likedBy;

            await updateUserPreferences(postId, collectionName, 'like');

        } else {
            likedBy = likedBy.filter(u => u !== currentUser.username);
            updateObj.likes = Math.max((post.likes || 0) - 1, 0);
            updateObj.likedBy = likedBy;

            await updateUserPreferences(postId, collectionName, 'dislike');
        }

        await updateDoc(postRef, updateObj);

        // Get new data after update
        const updatedSnapshot = await getDoc(postRef);
        const updatedPost = updatedSnapshot.data();
        const totalVotes = (updatedPost.likes || 0) + (updatedPost.dislikes || 0);
        const likePercentage = totalVotes > 0 ? Math.round(((updatedPost.likes || 0) / totalVotes) * 100) : 0;

        // Update displayed like percentage and buttons in recommendations
        if (document.getElementById('recommendationList')) {
            const itemElement = document.querySelector(`.recommendation-item[data-id="${postId}"]`);
            if (itemElement) {
                const percentageElement = itemElement.querySelector('.like-percentage');
                if (percentageElement) {
                    percentageElement.textContent = `${likePercentage}% of reviewers liked this, based on ${totalVotes} reviews`;
                }
                const buttons = itemElement.querySelectorAll('button');
                if (buttons[0]) {
                    // If user just liked, show "Liked!", else revert to "Like"
                    if (updateObj.likes && likedBy.includes(currentUser.username)) {
                        buttons[0].textContent = 'Liked!';
                    } else {
                        buttons[0].textContent = 'Like';
                    }
                    buttons[0].disabled = false;
                }
                if (buttons[1]) {
                    buttons[1].disabled = false;
                }
            }
        } else if (isSearch) {
            searchItems();
        } else {
            const itemElement = document.querySelector(`li[data-id="${postId}"]`);
            if (itemElement) {
                // Update like-percentage
                const percentageElement = itemElement.querySelector('.like-percentage');
                if (percentageElement) {
                    percentageElement.textContent = `${likePercentage}% of reviewers liked this, based on ${totalVotes} reviews`;
                }
                // Update button text and state
                const buttons = itemElement.querySelectorAll('button');
                if (buttons[0]) {
                    buttons[0].textContent = likedBy && likedBy.includes(currentUser.username) ? 'Liked!' : 'Like';
                }
                if (buttons[1]) {
                    buttons[1].textContent = dislikedBy && dislikedBy.includes(currentUser.username) ? 'Disliked!' : 'Dislike';
                }
            }
        }
    } catch (error) {
        console.error("Error liking post:", error);
    }
}

// Handles a user's dislikes
async function dislikePost(postId, collectionName, event, isSearch = false) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (!currentUser) return alert("You must be logged in.");

    try {
        // Record the user's dislike
        await addDoc(collection(db, "userLikes"), {
            username: currentUser.username,
            itemId: postId,
            rating: 'dislike',
            timestamp: new Date()
        });

        // Update the like/dislike points for user preferences
        const postRef = doc(db, collectionName, postId);
        const postSnapshot = await getDoc(postRef);
        const post = postSnapshot.data();

        let likedBy = post.likedBy || [];
        let dislikedBy = post.dislikedBy || [];
        const wasPreviouslyLiked = likedBy.includes(currentUser.username);
        const wasPreviouslyDisliked = dislikedBy.includes(currentUser.username);

        let updateObj = {};

        if (wasPreviouslyLiked) { 
            likedBy = likedBy.filter(u => u !== currentUser.username);
            updateObj.likes = Math.max((post.likes || 0) - 1, 0);
            updateObj.likedBy = likedBy;
            
            if (!dislikedBy.includes(currentUser.username)) { 
                dislikedBy.push(currentUser.username);
            }
            updateObj.dislikes = (post.dislikes || 0) + 1;
            updateObj.dislikedBy = dislikedBy;

            await updateUserPreferences(postId, collectionName, 'dislike');
            await updateUserPreferences(postId, collectionName, 'dislike');

        } else if (!wasPreviouslyDisliked) { 
            dislikedBy.push(currentUser.username);
            updateObj.dislikes = (post.dislikes || 0) + 1;
            updateObj.dislikedBy = dislikedBy;

            await updateUserPreferences(postId, collectionName, 'dislike');

        } else {
            dislikedBy = dislikedBy.filter(u => u !== currentUser.username);
            updateObj.dislikes = Math.max((post.dislikes || 0) - 1, 0); 
            updateObj.dislikedBy = dislikedBy;

            await updateUserPreferences(postId, collectionName, 'like');
        }

        await updateDoc(postRef, updateObj);

        // Get new data after update
        const updatedSnapshot = await getDoc(postRef);
        const updatedPost = updatedSnapshot.data();
        const totalVotes = (updatedPost.likes || 0) + (updatedPost.dislikes || 0);
        const likePercentage = totalVotes > 0 ? Math.round(((updatedPost.likes || 0) / totalVotes) * 100) : 0;

        // Update displayed like percentage and buttons in recommendations
        if (document.getElementById('recommendationList')) {
            const itemElement = document.querySelector(`.recommendation-item[data-id="${postId}"]`);
            if (itemElement) {
                const percentageElement = itemElement.querySelector('.like-percentage');
                if (percentageElement) {
                    percentageElement.textContent = `${likePercentage}% of reviewers liked this, based on ${totalVotes} reviews`;
                }
                const buttons = itemElement.querySelectorAll('button');
                if (buttons[1]) {
                    // If user just disliked, show "Disliked!", else revert to "Dislike"
                    if (updateObj.dislikes && dislikedBy.includes(currentUser.username)) {
                        buttons[1].textContent = 'Disliked!';
                    } else {
                        buttons[1].textContent = 'Dislike';
                    }
                    buttons[1].disabled = false;
                }
                if (buttons[0]) {
                    buttons[0].disabled = false;
                }
            }
        } else if (isSearch) {
            searchItems();
        } else {
            const itemElement = document.querySelector(`li[data-id="${postId}"]`);
            if (itemElement) {
                // Update like-percentage
                const percentageElement = itemElement.querySelector('.like-percentage');
                if (percentageElement) {
                    percentageElement.textContent = `${likePercentage}% of reviewers liked this, based on ${totalVotes} reviews`;
                }
                // Update button text and state
                const buttons = itemElement.querySelectorAll('button');
                if (buttons[0]) {
                    buttons[0].textContent = likedBy && likedBy.includes(currentUser.username) ? 'Liked!' : 'Like';
                }
                if (buttons[1]) {
                    buttons[1].textContent = dislikedBy && dislikedBy.includes(currentUser.username) ? 'Disliked!' : 'Dislike';
                }
            }
        }
    } catch (error) {
        console.error("Error disliking post:", error);
    }
}

// Function to edit a movie
async function editMovie(id) {
    const title = prompt("Enter new title:");
    const director = prompt("Enter new director:");
    const description = prompt("Enter new description:");
    if (title && director && description) {
        try {
            await updateDoc(doc(db, "movies", id), {
                title,
                director,
                description
            });
            alert('Movie updated successfully!');
            displayMovies();
        } catch (error) {
            console.error('Error updating movie: ', error);
        }
    }
}

// Function to delete a movie
async function deleteMovie(id) {
    await deleteDoc(doc(db, "movies", id));
    displayMovies();
}
window.deleteMovie = deleteMovie;

// Function to display TV shows
async function displayTvShows() {
    const tvShowList = document.getElementById('tvShowList');
    if (!tvShowList) return;
    tvShowList.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "tvShows"));
    querySnapshot.forEach((docSnap) => {
        const show = docSnap.data();
        window.displayTvShowItem(docSnap.id, show, tvShowList);
    });
}
window.displayTvShows = displayTvShows;

// Function to edit a TV show
async function editTvShow(id) {
    const title = prompt("Enter new title:");
    const creator = prompt("Enter new creator:");
    const description = prompt("Enter new description:");
    if (title && creator && description) {
        try {
            await updateDoc(doc(db, "tvShows", id), {
                title,
                creator,
                description
            });
            alert('TV Show updated successfully!');
            displayTvShows();
        } catch (error) {
            console.error('Error updating TV show: ', error);
        }
    }
}

// Function to delete a TV show
async function deleteTvShow(id) {
    await deleteDoc(doc(db, "tvShows", id));
    displayTvShows();
}
window.deleteTvShow = deleteTvShow;

// Function to display video games
async function displayVideoGames() {
    const videoGameList = document.getElementById('videoGameList');
    if (!videoGameList) return;
    videoGameList.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "videoGames"));
    querySnapshot.forEach((docSnap) => {
        const game = docSnap.data();
        window.displayVideoGameItem(docSnap.id, game, videoGameList);
    });
}
window.displayVideoGames = displayVideoGames;

// Function to delete a video game
async function deleteVideoGame(id) {
    await deleteDoc(doc(db, "videoGames", id));
    displayVideoGames();
}
window.deleteVideoGame = deleteVideoGame;

// Function to edit a video game
async function editVideoGame(id) {
    const title = prompt("Enter new title:");
    const developer = prompt("Enter new developer:");
    const description = prompt("Enter new description:");
    const genres = prompt("Enter new genres (comma-separated):");

    if (title && developer && description && genres) {
        try {
            await updateDoc(doc(db, "videoGames", id), {
                title,
                developer,
                description,
                genres: genres.split(",").map(genre => genre.trim())
            });
            alert('Video Game updated successfully!');
            displayVideoGames();
        } catch (error) {
            console.error('Error updating video game:', error);
        }
    }
}
window.editVideoGame = editVideoGame;

// Helper function to get selected genres from checkboxes
function getSelectedGenres(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

// Handle form submission for movies
const addMovieForm = document.getElementById('addMovieForm');
if (addMovieForm) {
    addMovieForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('movieTitle').value;
        const director = document.getElementById('movieDirector').value;
        const description = document.getElementById('movieDescription').value;
        const genres = getSelectedGenres('movieGenres');
        const fileInput = document.getElementById('movieImage');
        const file = fileInput.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
                // Convert image to Base64 string
                const base64Image = reader.result;
                try {
                    await addDoc(collection(db, "movies"), {
                        title,
                        director,
                        description,
                        genres,
                        image: base64Image
                    });
                    alert('Movie added successfully!');
                    addMovieForm.reset();
                    displayMovies();
                } catch (error) {
                    console.error('Error adding movie:', error);
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image.');
        }
    });
}

// Handle form submission for TV shows
const addTvShowForm = document.getElementById('addTvShowForm');
if (addTvShowForm) {
    addTvShowForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('tvShowTitle').value;
        const creator = document.getElementById('tvShowCreator').value;
        const description = document.getElementById('tvShowDescription').value;
        const genres = getSelectedGenres('tvShowGenres');
        const fileInput = document.getElementById('tvShowImage');
        const file = fileInput.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
                // Convert image to Base64 string
                const base64Image = reader.result;
                try {
                    await addDoc(collection(db, "tvShows"), {
                        title,
                        creator,
                        description,
                        genres,
                        image: base64Image
                    });
                    alert('TV Show added successfully!');
                    addTvShowForm.reset();
                    displayTvShows();
                } catch (error) {
                    console.error('Error adding TV show:', error);
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image.');
        }
    });
}

// Handle form submission for video games
const addVideoGameForm = document.getElementById('addVideoGameForm');
if (addVideoGameForm) {
    addVideoGameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('videoGameTitle').value;
        const developer = document.getElementById('videoGameDeveloper').value;
        const description = document.getElementById('videoGameDescription').value;
        const genres = getSelectedGenres('videoGameGenres');
        const fileInput = document.getElementById('videoGameImage');
        const file = fileInput.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
                // Convert image to Base64 string
                const base64Image = reader.result;
                try {
                    await addDoc(collection(db, "videoGames"), {
                        title,
                        developer,
                        description,
                        genres,
                        image: base64Image
                    });
                    alert('Video Game added successfully!');
                    addVideoGameForm.reset();
                    displayVideoGames();
                } catch (error) {
                    console.error('Error adding video game:', error);
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image.');
        }
    });
}

// Attach delete and edit functions
window.deleteMovie = deleteMovie;
window.editMovie = editMovie;
window.deleteTvShow = deleteTvShow;
window.editTvShow = editTvShow;
window.deleteVideoGame = deleteVideoGame;
window.editVideoGame = editVideoGame;

// Attach functions to the global scope
window.displayMovies = displayMovies;
window.displayTvShows = displayTvShows;
window.displayVideoGames = displayVideoGames;
window.addComment = addComment;
window.deleteComment = deleteComment;
window.likePost = likePost;
window.dislikePost = dislikePost;

// Display and Refresh
function reloadDisplay(collectionName) {
    const searchTerm = document.getElementById('searchInput')?.value.trim();
    if (searchTerm) {
        searchItems();
    } else {
        if (collectionName === "movies") displayMovies();
        if (collectionName === "tvShows") displayTvShows();
        if (collectionName === "videoGames") displayVideoGames();
    }

    // Only refresh recommendations if on the home page
    if (!document.getElementById('recommendationList')) return;

    // For home page update the existing recommendations without fetching new entries
    const container = document.getElementById('recommendationList');
    if (container) {
        const items = container.querySelectorAll('.recommendation-item');
        items.forEach(item => {
            const postId = item.getAttribute('data-id');
            const type = item.querySelector('p:first-of-type')?.textContent.includes('Director') ? 'movies' : 
                        item.querySelector('p:first-of-type')?.textContent.includes('Creator') ? 'tvShows' : 'videoGames';
            
            // Update like percentage
            const postRef = doc(db, type, postId);
            getDoc(postRef).then(postSnapshot => {
                const post = postSnapshot.data();
                const totalVotes = (post.likes || 0) + (post.dislikes || 0);
                const likePercentage = totalVotes > 0 ? Math.round(((post.likes || 0) / totalVotes) * 100) : 0;
                
                const percentageElement = item.querySelector('p:last-of-type');
                if (percentageElement) {
                    percentageElement.textContent = `${likePercentage}% of reviewers liked this, based on ${totalVotes} reviews`;
                }
            });
        });
    }
}

// Search function
async function searchItems() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (!searchTerm) return;

    let collectionName;
    let listElement;

    if (document.getElementById('movieList')) {
        collectionName = 'movies';
        listElement = document.getElementById('movieList');
    } else if (document.getElementById('tvShowList')) {
        collectionName = 'tvShows';
        listElement = document.getElementById('tvShowList');
    } else if (document.getElementById('videoGameList')) {
        collectionName = 'videoGames';
        listElement = document.getElementById('videoGameList');
    } else {
        return;
    }

    // Clear the list to prevent duplicates from appearing
    clearList(listElement);

    const querySnapshot = await getDocs(collection(db, collectionName));
    querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        if (item.title.toLowerCase().includes(searchTerm)) {
            const totalVotes = (item.likes || 0) + (item.dislikes || 0);
            const likePercentage = totalVotes > 0 ? Math.round(((item.likes || 0) / totalVotes) * 100) : 0;

            const li = document.createElement("li");
            li.innerHTML = `
                <p><strong>Title:</strong> ${item.title}</p>
                <p><strong>Description:</strong> ${item.description}</p>
                ${item.image ? `<img src="${item.image}" alt="${item.title}" style="max-width: 100%; height: auto;">` : ''}
                <p class="like-percentage">${likePercentage}% of reviewers liked this, based on ${totalVotes} reviews</p>
            `;

            // Create buttons container
            const buttonContainer = document.createElement("div");
            buttonContainer.style.marginTop = "10px";

            // Create Like button
            const likeButton = document.createElement("button");
            likeButton.textContent = "Like";
            likeButton.addEventListener("click", (event) => likePost(docSnap.id, collectionName, event, true));

            // Create Dislike button
            const dislikeButton = document.createElement("button");
            dislikeButton.textContent = "Dislike";
            dislikeButton.addEventListener("click", (event) => dislikePost(docSnap.id, collectionName, event, true));

            // Append buttons to container
            buttonContainer.appendChild(likeButton);
            buttonContainer.appendChild(dislikeButton);
            li.appendChild(buttonContainer);

            // Add comments section
            const commentsList = document.createElement("ul");
            commentsList.id = `comments-${collectionName}-${docSnap.id}`;
            li.appendChild(commentsList);

            if (currentUser && !currentUser.isAdmin) {
                const commentInput = document.createElement("textarea");
                commentInput.id = `commentInput-${collectionName}-${docSnap.id}`;
                commentInput.placeholder = "Write a comment";
                li.appendChild(commentInput);

                const addCommentButton = document.createElement("button");
                addCommentButton.textContent = "Add Comment";
                addCommentButton.addEventListener("click", () => addComment(docSnap.id, collectionName));
                li.appendChild(addCommentButton);
            }

            listElement.appendChild(li);

            displayComments(docSnap.id, collectionName);
        }
    });
}

// Function for displaying items (movies, Shows, Games)
function displayMovieItem(id, movie, container) {
    const genres = Array.isArray(movie.genres) ? movie.genres : [];
    const totalVotes = (movie.likes || 0) + (movie.dislikes || 0);
    const likePercentage = totalVotes > 0 ? Math.round(((movie.likes || 0) / totalVotes) * 100) : 0;

    const li = document.createElement("li");
    li.setAttribute('data-id', id);

    // Check if the current user liked/disliked
    const likedBy = movie.likedBy || [];
    const dislikedBy = movie.dislikedBy || [];
    const userLiked = currentUser && likedBy.includes(currentUser.username);
    const userDisliked = currentUser && dislikedBy.includes(currentUser.username);
    // Construct and set html for movie entries with buttons and comments
    li.innerHTML = `
        <p><strong>Title:</strong> <span class="editable" data-field="title">${movie.title}</span></p>
        <p><strong>Director:</strong> <span class="editable" data-field="director">${movie.director}</span></p>
        <p><strong>Description:</strong> <span class="editable" data-field="description">${movie.description}</span></p>
        <p><strong>Genres:</strong> <span class="editable" data-field="genres">${genres.join(", ")}</span></p>
        <img src="${movie.image || 'placeholder.jpg'}" alt="${movie.title}" style="max-width: 100%; height: auto;">
        <p class="like-percentage">${likePercentage}% of reviewers liked this, based on ${totalVotes} reviews</p>
        ${currentUser && !currentUser.isAdmin ? `
            <div class="action-buttons">
                <button type="button" class="like-button${userLiked ? ' liked' : ''}" onclick="likePost('${id}', 'movies', event)">${userLiked ? 'Liked!' : 'Like'}</button>
                <button type="button" class="dislike-button${userDisliked ? ' disliked' : ''}" onclick="dislikePost('${id}', 'movies', event)">${userDisliked ? 'Disliked!' : 'Dislike'}</button>
            </div>
        ` : ""}
        ${currentUser && currentUser.isAdmin ? `
            <button class="edit-button" onclick="editEntry('${id}', 'movies', this)">Edit</button>
            <button class="delete-button" onclick="deleteMovie('${id}')">Delete entry</button>
        ` : ""}
        <div>
            <h3>Comments</h3>
            <ul id="comments-movies-${id}"></ul>
            ${currentUser && !currentUser.isAdmin ? `
                <textarea id="commentInput-movies-${id}" placeholder="Write a comment"></textarea>
                <button type="button" onclick="addComment('${id}', 'movies')">Add Comment</button>
            ` : ""}
        </div>
    `;
    container.appendChild(li);
    displayComments(id, "movies");
}

//Function to clear search
function clearSearch() {
    document.getElementById('searchInput').value = "";
    if (document.getElementById('movieList')) displayMovies();
    if (document.getElementById('tvShowList')) displayTvShows();
    if (document.getElementById('videoGameList')) displayVideoGames();
}

window.searchItems = searchItems;
window.clearSearch = clearSearch;

function clearList(listElement) {
    if (listElement) {
        listElement.innerHTML = "";
    }
}

async function updateUserPreferences(itemId, collectionName, rating) {
    if (!currentUser) return;

    try {
        // Get the item to determine its genres
        const itemRef = doc(db, collectionName, itemId);
        const itemSnapshot = await getDoc(itemRef);
        const item = itemSnapshot.data();

        if (!item || !item.genres) return;

        // Get current preferences
        const prefRef = doc(db, "userPreferences", currentUser.username);
        const prefSnapshot = await getDoc(prefRef);
        const currentPrefs = prefSnapshot.exists() ? prefSnapshot.data() : {};

        // Update preferences based on rating
        const increment = rating === 'like' ? 1 : -1;
        item.genres.forEach(genre => {
            currentPrefs[genre] = (currentPrefs[genre] || 0) + increment;
        });

        // Save updated preferences
        await setDoc(prefRef, currentPrefs);
    } catch (error) {
        console.error("Error updating user preferences:", error);
    }
}

window.editComment = async function(postId, collectionName, commentId, btn) {
    const li = btn.closest('li');
    const textSpan = li.querySelector('.comment-text');
    const oldText = textSpan.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldText;
    input.style.width = '80%';

    // Replace text with input
    textSpan.replaceWith(input);

    btn.textContent = 'Save';
    btn.onclick = async function() {
        const newText = input.value.trim();
        if (newText && newText !== oldText) {
            const commentRef = doc(db, `${collectionName}/${postId}/comments`, commentId);
            await updateDoc(commentRef, { text: newText });
        }
        displayComments(postId, collectionName);
    };
};

window.db = db;
window.firestoreExports = { getDocs, collection, deleteDoc, doc, query, where, updateDoc, getDoc, setDoc };

window.displayTvShowItem = function (id, show, container) {
    const genres = Array.isArray(show.genres) ? show.genres : [];
    const totalVotes = (show.likes || 0) + (show.dislikes || 0);
    const likePercentage = totalVotes > 0 ? Math.round(((show.likes || 0) / totalVotes) * 100) : 0;
    const likedBy = show.likedBy || [];
    const dislikedBy = show.dislikedBy || [];
    const userLiked = currentUser && likedBy.includes(currentUser.username);
    const userDisliked = currentUser && dislikedBy.includes(currentUser.username);

    const li = document.createElement("li");
    li.setAttribute("data-id", id);
    // Construct and set html for Show entries with buttons and comments
    li.innerHTML = `
        <p><strong>Title:</strong> <span class="editable" data-field="title">${show.title}</span></p>
        <p><strong>Creator:</strong> <span class="editable" data-field="creator">${show.creator}</span></p>
        <p><strong>Description:</strong> <span class="editable" data-field="description">${show.description}</span></p>
        <p><strong>Genres:</strong> <span class="editable" data-field="genres">${genres.join(", ")}</span></p>
        <img src="${show.image || 'placeholder.jpg'}" alt="${show.title}" style="max-width: 100%; height: auto;">
        <p class="like-percentage">${likePercentage}% of reviewers liked this, based on ${totalVotes} reviews</p>
        ${currentUser && !currentUser.isAdmin ? `
            <div class="action-buttons">
                <button type="button" class="like-button${userLiked ? ' liked' : ''}" onclick="likePost('${id}', 'tvShows', event)">${userLiked ? 'Liked!' : 'Like'}</button>
                <button type="button" class="dislike-button${userDisliked ? ' disliked' : ''}" onclick="dislikePost('${id}', 'tvShows', event)">${userDisliked ? 'Disliked!' : 'Dislike'}</button>
            </div>
        ` : ""}
        ${currentUser && currentUser.isAdmin ? `
            <button class="edit-button" onclick="editEntry('${id}', 'tvShows', this)">Edit</button>
            <button class="delete-button" onclick="deleteTvShow('${id}')">Delete entry</button>
        ` : ""}
        <div>
            <h3>Comments</h3>
            <ul id="comments-tvShows-${id}"></ul>
            ${currentUser && !currentUser.isAdmin ? `
                <textarea id="commentInput-tvShows-${id}" placeholder="Write a comment"></textarea>
                <button type="button" onclick="addComment('${id}', 'tvShows')">Add Comment</button>
            ` : ""}
        </div>
    `;
    container.appendChild(li);
    displayComments(id, "tvShows");
};

window.displayVideoGameItem = function (id, game, container) {
    const genres = Array.isArray(game.genres) ? game.genres : [];
    const totalVotes = (game.likes || 0) + (game.dislikes || 0);
    const likePercentage = totalVotes > 0 ? Math.round(((game.likes || 0) / totalVotes) * 100) : 0;
    const likedBy = game.likedBy || [];
    const dislikedBy = game.dislikedBy || [];
    const userLiked = currentUser && likedBy.includes(currentUser.username);
    const userDisliked = currentUser && dislikedBy.includes(currentUser.username);

    const li = document.createElement("li");
    li.setAttribute("data-id", id);
    // Construct and set html for Game entries with buttons and comments
    li.innerHTML = `
        <p><strong>Title:</strong> <span class="editable" data-field="title">${game.title}</span></p>
        <p><strong>Developer:</strong> <span class="editable" data-field="developer">${game.developer}</span></p>
        <p><strong>Description:</strong> <span class="editable" data-field="description">${game.description}</span></p>
        <p><strong>Genres:</strong> <span class="editable" data-field="genres">${genres.join(", ")}</span></p>
        <img src="${game.image || 'placeholder.jpg'}" alt="${game.title}" style="max-width: 100%; height: auto;">
        <p class="like-percentage">${likePercentage}% of reviewers liked this, based on ${totalVotes} reviews</p>
        ${currentUser && !currentUser.isAdmin ? `
            <div class="action-buttons">
                <button type="button" class="like-button${userLiked ? ' liked' : ''}" onclick="likePost('${id}', 'videoGames', event)">${userLiked ? 'Liked!' : 'Like'}</button>
                <button type="button" class="dislike-button${userDisliked ? ' disliked' : ''}" onclick="dislikePost('${id}', 'videoGames', event)">${userDisliked ? 'Disliked!' : 'Dislike'}</button>
            </div>
        ` : ""}
        ${currentUser && currentUser.isAdmin ? `
            <button class="edit-button" onclick="editEntry('${id}', 'videoGames', this)">Edit</button>
            <button class="delete-button" onclick="deleteVideoGame('${id}')">Delete entry</button>
        ` : ""}
        <div>
            <h3>Comments</h3>
            <ul id="comments-videoGames-${id}"></ul>
            ${currentUser && !currentUser.isAdmin ? `
                <textarea id="commentInput-videoGames-${id}" placeholder="Write a comment"></textarea>
                <button type="button" onclick="addComment('${id}', 'videoGames')">Add Comment</button>
            ` : ""}
        </div>
    `;
    container.appendChild(li);
    displayComments(id, "videoGames");
};

async function editEntry(id, collectionName, button) {
    const li = button.closest("li");
    const editableFields = li.querySelectorAll(".editable");

    // Define genre options for each collection
    const genreOptions = {
        movies: [
            "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Documentary", "Drama", "Family",
            "Fantasy", "History", "Horror", "Musical", "Mystery", "Romance", "Sci-fi", "Sport", "Thriller", "War", "Western"
        ],
        tvShows: [
            "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Documentary", "Drama", "Family",
            "Fantasy", "History", "Horror", "Musical", "Mystery", "Romance", "Sci-fi", "Sport", "Thriller", "War", "Western"
        ],
        videoGames: [
            "2d", "Action", "Adventure", "Fighting", "Horror", "Indie", "Multiplayer", "Open-world", "Platformer",
            "Puzzle", "Racing", "Rhythm", "Roguelike", "RPG", "Sandbox", "Shooter", "Simulation", "Sports", "Strategy", "Survival", "Visual Novel"
        ]
    };

    if (button.textContent === "Edit") {
        // Turn fields into input fields
        editableFields.forEach(field => {
            if (field.dataset.field === "genres") {
                // Create checkboxes for genres
                const currentGenres = field.textContent.split(",").map(g => g.trim());
                const container = document.createElement("div");
                container.style.display = "grid";
                container.style.gridTemplateColumns = "auto 1fr";
                container.style.gap = "5px 10px";
                container.dataset.field = "genres";
                genreOptions[collectionName].forEach(genre => {
                    const label = document.createElement("label");
                    label.style.display = "contents";
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.value = genre;
                    if (currentGenres.includes(genre)) checkbox.checked = true;
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(" " + genre));
                    container.appendChild(label);
                });
                field.replaceWith(container);
            } else {
                const input = document.createElement("input");
                input.type = "text";
                input.value = field.textContent.trim();
                input.dataset.field = field.dataset.field;
                input.style.width = "100%";
                field.replaceWith(input);
            }
        });
        button.textContent = "Save";
    } else if (button.textContent === "Save") {
        // Save changes to Firestore
        const updates = {};
        const inputs = li.querySelectorAll("input[data-field]");
        inputs.forEach(input => {
            updates[input.dataset.field] = input.value.trim();
        });

        // Handle genres checkboxes
        const genresContainer = li.querySelector("div[data-field='genres']");
        if (genresContainer) {
            const checked = genresContainer.querySelectorAll("input[type='checkbox']:checked");
            updates.genres = Array.from(checked).map(cb => cb.value);
        }

        try {
            await updateDoc(doc(db, collectionName, id), updates);
            alert("Entry updated successfully!");

            // Replace input fields with updated text
            inputs.forEach(input => {
                const span = document.createElement("span");
                span.className = "editable";
                span.dataset.field = input.dataset.field;
                span.textContent = input.value.trim();
                input.replaceWith(span);
            });

            // Replace genres checkboxes with text
            if (genresContainer) {
                const span = document.createElement("span");
                span.className = "editable";
                span.dataset.field = "genres";
                span.textContent = updates.genres.join(", ");
                genresContainer.replaceWith(span);
            }

            button.textContent = "Edit";
        } catch (error) {
            console.error("Error updating entry:", error);
            alert("Failed to update entry. Please try again.");
        }
    }
}
window.editEntry = editEntry;

window.displayMovieItem = displayMovieItem;
window.displayTvShowItem = displayTvShowItem;
window.displayVideoGameItem = displayVideoGameItem;
