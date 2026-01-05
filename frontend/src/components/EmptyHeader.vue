<template>
  <nav class="navbar-box">
    <div class="navbar-left">
      <router-link to="/" class="logo-link">
        <img src="../assets/images/campuschow_logo_landscape.png" alt="Smunch Logo" class="logo-image" />
      </router-link>
    </div>
   </nav>
</template>

<style scoped>
/* navbar */
.navbar-box {
  background-color: var(--secondary-color);
  padding: 10px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-body);
  font-size: 20px;
  height: auto;
  position: relative;
  width: 100%;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* left side: brand */
.navbar-left {
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;             
  color: var(--text-color);
}

/* Logo styling */
.logo-link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.3s ease;
  height: 100%;
}

.logo-image {
  height: 80px;
  width: auto;
  object-fit: contain;
  display: block;  /* Add this */
}

.logo-link:hover {
  transform: scale(1.05);
}

/* edits the entire centre container, not the specific links yet  */
.navbar-center {
  position: absolute;      
  left: 50%;             
  transform: translateX(-50%);  
  display: flex;
  gap: 20px;
}

/* targets only the tags inside the container, styling the individual links inside */
.navbar-center a {
  color: var(--text-color);
  font-family: var(--font-body);
  font-weight: 600;
  text-decoration: none;
  font-size: 20px;
  background: transparent;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.navbar-center a:hover {
  background-color: var(--primary-color);
  transform: translateY(-2px);
}

.navbar-center a.router-link-active {
  background-color: var(--primary-color);
  font-weight: 700;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* coins display */
.coins-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--tertiary-color);
  padding: 6px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: visible;
  border: 2px solid var(--primary-color);
  transition: all 0.3s ease;
}

.coins-display:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.coin-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.coin-image {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.coins-count {
  font-family: var(--font-heading);
  font-weight: bold;
  color: var(--text-color);
  font-size: 18px;
}

.profile-wrapper {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  gap: 10px;
}

.profile-wrapper:hover {
  background: rgba(34, 32, 30, 0.1);
  transform: scale(1.1);
}

.profile-wrapper svg {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.icon-circle {
  width: 36px;
  height: 36px;
  background-color: var(--tertiary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  border: 2px solid var(--text-color);
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: 50%;
}

.profile-menu {
  position: absolute;
  right: 0;
  top: 50px;
  background: var(--secondary-color);
  color: var(--text-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  width: 220px;
  z-index: 100;
  padding: 16px;
  border: 2px solid var(--primary-color);
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.dropdown-user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.dropdown-user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown-user-name {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 16px;
  color: var(--text-color);
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close:hover {
  background: var(--tertiary-color);
  color: var(--text-color);
}

.profile-menu hr {
  margin: 12px 0;
  border: none;
  border-top: 2px solid var(--primary-color);
}

.profile-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.profile-menu li {
  border-radius: 8px;
  transition: background-color 0.2s ease;
  cursor: pointer;
  margin: 2px 0;
}

.profile-menu li:hover {
  background-color: var(--tertiary-color);
}

.profile-menu li a {
  all: unset;
  display: block;
  padding: 10px 12px;
  width: 100%;
  color: var(--text-color);
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  letter-spacing: -0.01em;
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .navbar-box {
    padding: 0 15px;
    height: 55px;
  }
  
  .navbar-left a {
    font-size: 20px;
  }
  
  .navbar-center {
    display: none;
  }
  
  .coins-display {
    margin-right: 10px;
    padding: 4px 12px;
  }
  
  .coins-count {
    font-size: 14px;
  }
  
  .coin-image {
    width: 24px;
    height: 24px;
  }
  
  .icon-circle {
    width: 35px;
    height: 35px;
  }
}

@media (max-width: 480px) {
  .navbar-box {
    padding: 0 10px;
    height: 50px;
  }
  
  .navbar-left a {
    font-size: 18px;
  }
  
  .coins-display {
    margin-right: 5px;
    padding: 3px 10px;
  }
  
  .coins-count {
    font-size: 12px;
  }
  
  .coin-image {
    width: 20px;
    height: 20px;
  }
  
  .icon-circle {
    width: 32px;
    height: 32px;
  }
  
  .profile-menu {
    width: 200px;
    right: -10px;
  }
  
  .profile-menu li a {
    font-size: 14px;
    padding: 8px 10px;
  }
}

.profile-menu hr {
  margin: 10px 0;
  border: none;
  border-top: 2px solid var(--primary-color);
}

/* Responsive design */
@media (max-width: 768px) {
  .profile-menu {
    width: 200px;
    right: 10px;
  }

  .dropdown-user-name {
    font-size: 13px;
  }
}

.logout-btn {
  width: 100%;
  background: var(--tertiary-color);
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  padding: 10px 12px;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  cursor: pointer;
  transition: background .15s ease, transform .05s ease;
}
.logout-btn:hover { background: var(--primary-color); }
.logout-btn:active { transform: translateY(1px); }

</style>
