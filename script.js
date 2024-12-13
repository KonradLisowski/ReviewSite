// Import for firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// My Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAl_IPTN38LLyW6rc-RIjXw_hZTDvRQhLI",
    authDomain: "reviewsite2-31100.firebaseapp.com",
    projectId: "reviewsite2-31100",
    storageBucket: "reviewsite2-31100.firebasestorage.app",
    messagingSenderId: "824076074226",
    appId: "1:824076074226:web:7400ac69d1347f19ade46b",
    measurementId: "G-4RCSQR7C6Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to display movies
async function displayMovies() {
    try {
        // Get all data for movies
        const querySnapshot = await getDocs(collection(db, "movies"));
        const movieList = document.getElementById('movieList');
        movieList.innerHTML = "";  // Clear the list before displaying the new data
        querySnapshot.forEach((doc) => {
            const movie = doc.data();
            const li = document.createElement("li");
            // Create movie list with movie details and buttons for editing and deleting
            li.innerHTML = `
                <p><span>Title:</span> ${movie.title}</p>
                <p><span>Director:</span> ${movie.director}</p>
                <p><span>Description:</span> ${movie.description}</p>
                <button class="edit-button" onclick="editMovie('${doc.id}')">Edit</button>
                <button class="delete-button" onclick="deleteMovie('${doc.id}')">Delete</button>
            `;
            movieList.appendChild(li);  // Add the new movie to the movie list
        });
    } catch (error) {
        console.error('Error fetching movies: ', error);  // log a basic error if the movie cannot be fetched from firebase
    }
}

// Function to edit a movie
async function editMovie(id) {
    // Prompt for the user to enter new movie details
    const title = prompt("Enter new title:");
    const director = prompt("Enter new director:");
    const description = prompt("Enter new description:");
    if (title && director && description) {
        try {
            // Update the movie data with the new details
            await updateDoc(doc(db, "movies", id), {
                title,
                director,
                description
            });
            alert('Movie updated successfully!');  // Show when successful
            displayMovies();  // Refresh the list of movies
        } catch (error) {
            console.error('Error updating movie: ', error);  // log a basic error if the movie cannot be fetched from firebase
        }
    }
}

// Function to delete a movie
async function deleteMovie(id) {
    try {
        // Delete the movie data from the database
        await deleteDoc(doc(db, "movies", id));
        alert('Movie deleted successfully!');  // Show when successful
        displayMovies();  // Refresh the list of movies
    } catch (error) {
        console.error('Error deleting movie: ', error);  // log a basic error if the movie cannot be deleted from firebase
    }
}

// Function to display TV shows
async function displayTvShows() {
    try {
        const querySnapshot = await getDocs(collection(db, "tvShows"));
        const tvShowList = document.getElementById('tvShowList');
        tvShowList.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const tvShow = doc.data();
            const li = document.createElement("li");
            li.innerHTML = `
                <p><span>Title:</span> ${tvShow.title}</p>
                <p><span>Creator:</span> ${tvShow.creator}</p>
                <p><span>Description:</span> ${tvShow.description}</p>
                <button class="edit-button" onclick="editTvShow('${doc.id}')">Edit</button>
                <button class="delete-button" onclick="deleteTvShow('${doc.id}')">Delete</button>
            `;
            tvShowList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching TV shows: ', error);
    }
}

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
    try {
        await deleteDoc(doc(db, "tvShows", id));
        alert('TV Show deleted successfully!');
        displayTvShows();
    } catch (error) {
        console.error('Error deleting TV show: ', error);
    }
}

// Function to display video games
async function displayVideoGames() {
    try {
        const querySnapshot = await getDocs(collection(db, "videoGames"));
        const videoGameList = document.getElementById('videoGameList');
        videoGameList.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const videoGame = doc.data();
            const li = document.createElement("li");
            li.innerHTML = `
                <p><span>Title:</span> ${videoGame.title}</p>
                <p><span>Developed by:</span> ${videoGame.developer}</p>
                <p><span>Description:</span> ${videoGame.description}</p>
                <button class="edit-button" onclick="editVideoGame('${doc.id}')">Edit</button>
                <button class="delete-button" onclick="deleteVideoGame('${doc.id}')">Delete</button>
            `;
            videoGameList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching video games: ', error);
    }
}

// Function to edit a video game
async function editVideoGame(id) {
    const title = prompt("Enter new title:");
    const developer = prompt("Enter new developer:");
    const description = prompt("Enter new description:");
    if (title && developer && description) {
        try {
            await updateDoc(doc(db, "videoGames", id), {
                title,
                developer,
                description
            });
            alert('Video Game updated successfully!');
            displayVideoGames();
        } catch (error) {
            console.error('Error updating video game: ', error);
        }
    }
}

// Function to delete a video game
async function deleteVideoGame(id) {
    try {
        await deleteDoc(doc(db, "videoGames", id));
        alert('Video Game deleted successfully!');
        displayVideoGames();
    } catch (error) {
        console.error('Error deleting video game: ', error);
    }
}

// Handle form submission for movies
document.getElementById('addMovieForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('movieTitle').value;
    const director = document.getElementById('movieDirector').value;
    const description = document.getElementById('movieDescription').value;

    try {
        await addDoc(collection(db, "movies"), {
            title,
            director,
            description
        });
        alert('Movie added successfully!');
        document.getElementById('addMovieForm').reset();
        displayMovies();
    } catch (error) {
        console.error('Error adding movie: ', error);
    }
});

// Handle form submission for TV shows
document.getElementById('addTvShowForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('tvShowTitle').value;
    const creator = document.getElementById('tvShowCreator').value;
    const description = document.getElementById('tvShowDescription').value;

    try {
        await addDoc(collection(db, "tvShows"), {
            title,
            creator,
            description
        });
        alert('TV Show added successfully!');
        document.getElementById('addTvShowForm').reset();
        displayTvShows();
    } catch (error) {
        console.error('Error adding TV show: ', error);
    }
});

// Handle form submission for video games
document.getElementById('addVideoGameForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('videoGameTitle').value;
    const developer = document.getElementById('videoGameDeveloper').value;
    const description = document.getElementById('videoGameDescription').value;

    try {
        await addDoc(collection(db, "videoGames"), {
            title,
            developer,
            description
        });
        alert('Video Game added successfully!');
        document.getElementById('addVideoGameForm').reset();
        displayVideoGames();
    } catch (error) {
        console.error('Error adding video game: ', error);
    }
});

// Initial display of movies, TV shows, and video games
displayMovies();
displayTvShows();
displayVideoGames();

// Attach delete and edit functions
window.deleteMovie = deleteMovie;
window.editMovie = editMovie;
window.deleteTvShow = deleteTvShow;
window.editTvShow = editTvShow;
window.deleteVideoGame = deleteVideoGame;
window.editVideoGame = editVideoGame;
