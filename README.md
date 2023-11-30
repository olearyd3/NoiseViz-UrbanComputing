# Urban Computing App - Assignment 4: NoiseViz

This is my web app, NoiseViz, created as part of Assignment 4 for the module CS7NS4 Urban Computing in Trinity College Dublin using React.js, d3.js and Google Firebase.

### To run the application locally:

1.  Clone the repository

2.  Install relevant dependencies using npm:

        npm install react
        npm install d3
        npm install react-leaflet

3.  Due to potential CORS issues when running locally, a CORS proxy has been included. To activate it visit "https://cors-anywhere.herokuapp.com/" and request temporary access.

4.  Run the code locally using `npm run dev`

### How to use the app

1. Create an account on the 'Sign Up' page

2. Login with your user credentials on the 'Log In' page

3. On the home page, a visualisation of Dublin city with markers denoting noise levels at certain locations will render along with two buttons and a line chart.

4. Users can upload data to Firebase using the buttons on the homepage.

5. The line chart can be edited using the dropdown menu above it.

6. The settings page can be accessed where users can log out of their account.

### The application being used

![](https://github.com/olearyd3/NoiseViz-UrbanComputing/src/assets/NoiseViz.gif)
