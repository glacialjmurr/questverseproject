document.addEventListener("DOMContentLoaded", () => {
    const createPostBtn = document.getElementById('createPostBtn');
    const submitPostBtn = document.getElementById('submitPostBtn');
    const postModal = new bootstrap.Modal(document.getElementById('createPostModal'));


    // Initially show the register content
    document.getElementById('registerForm').style.display = 'block';

    //Delete account listener
    document.getElementById('deleteAccountBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete your account?')) {
            deleteAccount();
        }
    });

    
    // Attach event listeners to navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            // Show the targeted section only
            document.getElementById(targetId).style.display = 'block';
        });    
    });

    document.querySelector('a[data-target="homeContent').addEventListener('click', function() {
        // Display home content
        const homeContent = document.getElementById('homeContent');
        homeContent.style.display = 'block';
    
        // Call the function to load recommended users
        loadRecommendedUsers();
    });

    document.querySelector('a[data-target="profileContent"]').addEventListener('click', function() {
        const profileContent = document.getElementById('profileContent');
        profileContent.style.display="block";
        loadUserProfile();
    });

    document.addEventListener('click', function(event) {
        if (event.target.matches('a[data-target="newsContent"]')) {
          event.preventDefault();
          
          // Hide all content sections
          document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
          });
          
          // Show the news content section and load news
          document.getElementById('newsContent').style.display = 'block';
          loadGamingNews();
        }
      });

    // Open the create post modal
    createPostBtn.addEventListener('click', () => {
        postModal.show();
    });

    // Handle the posting of data
    submitPostBtn.addEventListener('click', () => {
        const postContent = document.getElementById('postText').value;
        // Validate post content
        if (!postContent) {
            alert('Please enter some text for your post.');
            return;
        }

        // Send the post to the server
        fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: postContent })
            })
            .then(response => {
                if (!response.ok) {
                throw new Error('Error in response');
                }
            return response.json();
          })
          .then(data => {
            addPostToHomeFeed(data); // Update the UI with the new post
            document.getElementById('postText').value = ''; // Clear the input field
            refreshFooterLevel(); 
          })
          .catch(error => {
            console.error('Error:', error);
            alert('Failed to create post: ' + error.message);
          });
     });

    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', function(event) {
        event.preventDefault();
    
        var email = document.getElementById('loginEmail').value;
        var password = document.getElementById('loginPassword').value;
    
        // Perform the login request
        fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Login failed');
            }
            return response.json();
        })
        .then(data => {
            // Store the user ID in localStorage after successful login
            localStorage.setItem('userId', data.user.id);
            // Display the home content section and hide login and register form
            document.getElementById('homeContent').style.display = 'block';
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'none';
            // Fetch and display posts from followed users
            loadFollowedPosts();
            loadRecommendedUsers();
            refreshFooterLevel();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Login failed: ' + error.message);
        });
    });
    

    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', function(event) {
        event.preventDefault();
        var username = document.getElementById('registerUsername').value;
        var email = document.getElementById('registerEmail').value;
        var password = document.getElementById('registerPassword').value;
        fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Registration failed');
            }
            return response.json();
        })
        .then(data => {
            // Redirect to the login page
            showLoginForm(); 
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    // Search functionality
    document.body.addEventListener('keypress', function(e) {
        if (e.target.id === 'searchUserInput' && e.key === 'Enter') {
            e.preventDefault();  
            const username = e.target.value;
            searchUserByUsername(username);
            e.target.value = '';  
        }
    });

});

// Add posts to the home feed
function addPostToHomeFeed(postData) {
    const homePostContainer = document.getElementById('postContainer');
    // Check if container is available
    if (!homePostContainer) {
        console.error('Home post container is not available');
        return;
    }
    const postElement = createPostElement(postData);
    homePostContainer.prepend(postElement);
}

function loadFollowedPosts() {
    fetch('/api/posts/followed', {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load followed user posts');
        }
        return response.json();
    })
    .then(posts => {
        const postContainer = document.getElementById('postContainer');
        postContainer.innerHTML = ''; // Clear the container
        posts.forEach(post => {
            // Call the function that creates the HTML for a post and adds it to the container
            addPostToHomeFeed(post, postContainer);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function refreshFollowedPosts() {
    // Clear existing posts
    const postContainer = document.getElementById('postContainer');
    postContainer.innerHTML = '';

    // Load new posts from followed users
    loadFollowedPosts();
}

 

// Add posts to the user profile feed
function addPostToUserProfile(postData) {
    const userProfileContainer = document.getElementById('userPostsContainer');
    // Check if container is available
    if (!userProfileContainer) {
        console.error('User profile post container is not available');
        return;
    }
    const postElement = createPostElement(postData);
    userProfileContainer.prepend(postElement);
}

// This function creates a post element
function createPostElement(postData) {
    const username = postData.userId && postData.userId.username ? postData.userId.username : 'Anonymous';
    const content = postData.content || 'No content provided';

    const postElement = document.createElement('div');
    postElement.className = 'card mb-3 bg-dark text-white';
    postElement.innerHTML = `
        <div class="card-header">${username}</div>
        <div class="card-body-post">
            <p class="card-text-post">${content}</p>
        </div>
        
    `;
    return postElement;
}

  

function clearProfile() {
    const userProfileContainer = document.getElementById('userPostsContainer');
    userProfileContainer.innerHTML = '';  // Clear the post container

    const postCountElement = document.getElementById('postCount');
    if (postCountElement) {
        postCountElement.textContent = '';  // Clear the post count
    }

    const followersCountElement = document.getElementById('followersCount');
    if (followersCountElement) {
        followersCountElement.textContent = '';  // Clear the followers count
    }

    const followingCountElement = document.getElementById('followingCount');
    if (followingCountElement) {
        followingCountElement.textContent = '';  // Clear the following count
    }

    const followButton = document.getElementById('follow-btn');
    if (followButton) {
        followButton.remove();  // Remove the follow button if it exists
    }

    const userLevelDisplay = document.getElementById('userLevelDisplay');
    if(userLevelDisplay) {
        userLevelDisplay.textContent = '';
    }
}

// Load logged in users profile
function loadUserProfile() {
    // Clear the current profile information
    clearProfile();
  
    // Fetch the user stats
    fetch('/api/users/mystats', { credentials: 'include' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error fetching user stats');
        }
        return response.json();
      })
      .then(stats => {
        // Display the user stats
        document.getElementById('postCount').textContent = stats.postsCount;
        document.getElementById('followersCount').textContent = stats.followersCount;
        document.getElementById('followingCount').textContent = stats.followingCount;

        // Update the level display
        const userLevelDisplay = document.getElementById('userLevelDisplay');
        userLevelDisplay.textContent = `LVL ${stats.level}`;
  
        // Continue to fetch and display the user's posts
        return fetch('/api/posts/byuser', { credentials: 'include' });
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error fetching posts');
        }
        return response.json();
      })
      .then(posts => {
        posts.forEach(postData => {
          addPostToUserProfile(postData); 
        });
      })
      .catch(err => {
        console.error('Failed to load profile:', err);
      });
  }

  
// Loading a different users profile
function searchUserByUsername(username) {
    clearProfile();  
    
    // Fetch the user's posts by username. 
    fetch(`/api/posts/user/${username}`, { 
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            if(response.status === 404) {
                alert('User does not exist'); 
                throw new Error('User does not exist'); 
            } else {
                alert('An error occurred while fetching user data'); 
                throw new Error('An error occurred while fetching user data');
            }
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById('profileContent').style.display = 'block';
        const { user, posts, postsCount, followersCount, followingCount, level  } = data; 
        const userProfileContainer = document.getElementById('userPostsContainer');
        userProfileContainer.innerHTML = ''; // Clear existing posts

        if (user && user.posts) {
            user.posts.forEach(postData => {
                addPostToUserProfile(postData);
            });
        } else if (posts) {
            posts.forEach(postData => {
                addPostToUserProfile(postData);
            });
        } else {
            console.error('No posts data found');
        }

        // Update counts
        document.getElementById('postCount').textContent = postsCount;
        document.getElementById('followersCount').textContent = followersCount;
        document.getElementById('followingCount').textContent = followingCount;
        document.getElementById('userLevelDisplay').textContent = userLevelDisplay;
        userLevelDisplay.textContent = `LVL ${level}`;

        
     // Fetch following status
     return fetch(`/api/users/isFollowing/${username}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
})
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch following status');
        }
        return response.json();
    })
    
    .then(followingData => {
        let followButton = document.getElementById('follow-btn');
        if (!followButton) {
            followButton = document.createElement('button');
            followButton.id = 'follow-btn';
            document.querySelector('.white-bar-content').appendChild(followButton);
        }
    
        // Set the initial text of the follow button
        followButton.innerText = followingData.isFollowing ? 'Unfollow' : 'Follow';
    
        // Save the follow status and user ID in the button's dataset for later access
        followButton.dataset.isFollowing = followingData.isFollowing;
        followButton.dataset.userId = followingData.userId;
    
        // Click handler for the follow button
        followButton.onclick = () => {
            // Read the current state from the button's dataset
            const isFollowing = followButton.dataset.isFollowing === 'true';
            const userId = followButton.dataset.userId;
    
            // Determine the correct endpoint and method
            const endpoint = isFollowing ? `/api/users/unfollow/${userId}` : `/api/users/follow/${userId}`;
            
            // Perform the fetch request
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
                }
                return response.json();
            })
            .then(data => {
                console.log(data.message);
    
                // Toggle the isFollowing state after the operation is successful
                const newFollowStatus = !isFollowing;
                followButton.dataset.isFollowing = newFollowStatus;
                followButton.innerText = newFollowStatus ? 'Unfollow' : 'Follow';

                 // Update the follower count in the front end
                    const followersCountElement = document.getElementById('followersCount');
                    if (followersCountElement) {
                        // Get the current follower count and increment it by one
                        let currentFollowersCount = parseInt(followersCountElement.textContent);
                        currentFollowersCount += newFollowStatus ? 1 : -1; // Increment or decrement based on follow/unfollow action
                        followersCountElement.textContent = currentFollowersCount.toString(); 
    }

                // Refresh posts after following/unfollowing
                refreshFollowedPosts();
            })
            .catch(err => {
                console.error('Error:', err);
            });
        };
    })
    .catch(error => {
        console.error('Error:', error);
    });
    }

    // Follow function
    function toggleFollow(userId, isFollowing) {
        // Determine the correct endpoint based on whether the user is currently being followed
        const endpoint = isFollowing ? `/api/users/unfollow/${userId}` : `/api/users/follow/${userId}`;
    
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            
            // Correctly reference the followButton outside of this scope, if necessary
            const followButton = document.getElementById('follow-btn');
            followButton.textContent = isFollowing ? 'Follow' : 'Unfollow';
            followButton.dataset.isFollowing = !isFollowing; // Flip the isFollowing flag
        })
        .catch(err => {
            console.error('Error:', err);
        });
    }



// Function to load gaming news into the news feed
function loadGamingNews() {
    fetch('/api/news/gaming-news')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const articles = data; 
        const newsFeed = document.getElementById('newsFeed');
        newsFeed.innerHTML = ''; // Clear existing news
  
        Object.values(articles).forEach(article => {
          const newsItem = createNewsItem(article);
          newsFeed.appendChild(newsItem);
        });
      })
      .catch(error => {
        console.error('Fetch error:', error.message);
        alert('Failed to load news: ' + error.message);
      });
  }
  
  function createNewsItem(article) {
    const card = document.createElement('div');
    card.className = 'card mb-3 bg-dark';
  
    const img = document.createElement('img');
    img.src = article.image; 
    img.className = 'card-img-top';
    img.alt = 'News Image';
    img.style.width = '100%';  
    img.style.height = '275px';  
    img.style.objectFit = 'cover';  
  
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
  
    const title = document.createElement('h5');
    title.className = 'card-title-news-title';
    title.textContent = article.title;
  
    const text = document.createElement('p');
    text.className = 'card-text-news-desc';
    text.textContent = article.description;
  
    const readMore = document.createElement('a');
    readMore.href = article.url;
    readMore.className = 'btn btn-primary-news';
    readMore.textContent = 'Read More';
    readMore.target = '_blank';  // Open in a new tab

    const likeButton = document.createElement('a');
    likeButton.className = 'btn btn-primary-likenews';
    likeButton.textContent = 'Like';
  
    cardBody.appendChild(title);
    cardBody.appendChild(text);
    cardBody.appendChild(readMore);
    cardBody.appendChild(likeButton);
    card.appendChild(img);
    card.appendChild(cardBody);
    
  
    return card;
  }

  
  
  // Loads random usernames from the database 
function loadRecommendedUsers() {
  fetch('/api/users/recommended', { credentials: 'include' })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error fetching recommended users');
      }
      return response.json();
    })
    .then(recommendedUsers => {
        const recommendedContainer = document.getElementById('recommendedContainer');
        // Clear any previously loaded recommended users, but leave the label intact
        const usersOnly = Array.from(recommendedContainer.children).filter(child => child.id !== 'recommendedLabel');
        usersOnly.forEach(child => child.remove());

        recommendedUsers.forEach(user => {
            const userElement = createUserElement(user);
            recommendedContainer.appendChild(userElement);
      });
    })
    .catch(err => {
      console.error('Failed to load recommended users:', err);
    });
}

// Helper function to create HTML element for a user and loads the clicked users page
function createUserElement(user) {
    const userDiv = document.createElement('div');
    userDiv.classList.add('user-name'); 
    userDiv.innerHTML = `<p class="mb-0">${user.username}</p>`; 
    userDiv.addEventListener('click', () => {
      console.log('User clicked:', user.username); 
      searchUserByUsername(user.username);
    });
    return userDiv;
  }

// Footer refresh that is called after making a post
function refreshFooterLevel() {
    // Fetch the current user's level and XP
    fetch('/api/users/mystats', { credentials: 'include' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error fetching user stats');
        }
        return response.json();
      })
      .then(stats => {
        const level = stats.level;
        const xp = stats.xp;
        
        // Update the progress bar and level display
        const levelDisplay = document.getElementById('levelDisplay');
        const progressBar = document.querySelector('.progress-bar');
        
        levelDisplay.textContent = `Level ${level}`;
        progressBar.style.width = `${xp}%`;
        progressBar.textContent = `${xp}/100`;
      })
      .catch(err => {
        console.error('Failed to load user level and XP:', err);
      });
  }

  function logout() {
    // Hide all content sections except the login content
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById('loginForm').style.display = 'block';
}

  function deleteAccount() {
    fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete account');
        }
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById('registerForm').style.display = 'block';
        alert('Your account has been successfully deleted.');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to delete account: ' + error.message);
    });
}
