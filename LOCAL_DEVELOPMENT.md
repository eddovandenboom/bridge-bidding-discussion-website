# Local Development with Docker

To run this project locally in a stable way, you need to have Docker and Docker Compose installed. This method will set up the database, backend, and frontend services for you.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Running the Application

1.  **Create Environment File:**
    Create a `.env` file in the root of the project by copying the example file.
    ```bash
    cp .env.example .env
    ```
    The default values in `.env.example` are configured to work with Docker Compose, so you shouldn't need to make any changes.

2.  **Build and Start Services:**
    Open a terminal in the root of the project and run the following command:
    ```bash
    docker-compose up --build -d
    ```
    This command will build the Docker images for the frontend and backend services and start all services (`db`, `backend`, `frontend`) in detached mode.

3.  **Reset and Migrate the Database:**
    Once the containers are running, you need to reset the database to ensure a clean state and then apply the migrations.
    ```bash
    docker-compose exec backend npx prisma migrate reset --force
    ```
    This command will drop the database, re-create it, and apply all migrations. The `--force` flag is used to skip the interactive confirmation prompt, which is necessary in a non-interactive environment.

4.  **Access the Application:**
    You can now access the frontend of the application in your browser at:
    [http://localhost:5173](http://localhost:5173)

    The backend API will be available at `http://localhost:3001`.

## Stopping the Application

To stop all the running services, use the following command:
```bash
docker-compose down