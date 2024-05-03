## Project Overview

This is a Product management app. User can Add products, View all the available products, Apply various filters like price range,gender,occasions,etc. Sort the product list like price high to low, low to high, product creation date, etc. User can also Edit product detials by clicking on edit button corresponding to the product. And also delete the product if required.  

## Github Repo:

https://github.com/dhruvc121/mern-task

### Setting Up the Project

To set up the project locally, follow these steps:

1. Clone the repository and navigate to the project folder.
2. Import the product_database.sql file in to your MySQL database (you can use phpMyAdmin).
3. Create a .env.local file in your project directory with your own MySQL credentials as shown below.    <br>
    DB_NAME=your_db_name    <br>
    HOST=your_mysql_host_name    <br>
    USER_NAME=your_mysql_username    <br>
    PASSWORD=your_mysql_password    <br>
    PORT=your_msql_portno    <br>
    
4. Run `npm install --force`.
5. Setup the database, You would need mysql and workbench for the database. You can get it from here: https://dev.mysql.com/downloads/installer. To Import data in do refer to this document: https://dev.mysql.com/doc/workbench/en/wb-admin-export-import-management.html
6. Start the project using `npm run dev`.
7. Access the NextJS website at http://localhost:3000.

