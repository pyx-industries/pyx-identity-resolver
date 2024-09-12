# Link resolver

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API Specification

For detailed information about our API endpoints, request/response formats, and authentication methods, please refer to our API documentation:
[http://localhost:3000/api](http://localhost:3000/api)

## MinIO Configuration

### Overview

The IDR service uses MinIO for object storage. The Docker Compose configuration allows for flexible and persistent data storage across different operating systems.

### Configuration Details

In the `docker-compose.yml` file, MinIO's data storage is configured as follows:

```yaml
volumes:
  - ${MINIO_DATA_DIR:-./minio_data}:/data
```

This configuration uses an environment variable `MINIO_DATA_DIR` if set, otherwise defaulting to `./minio_data` in the current directory.

### Reasoning

1. **Cross-platform compatibility**: This setup works on both Unix-based systems (Linux, macOS) and Windows.
2. **Flexibility**: Users can easily change the data directory without modifying the `docker-compose.yml` file.
3. **Default behaviour**: If not configured, it uses a local directory, ensuring the setup works out of the box.
4. **Data persistence**: Allows for data to persist even if the container is removed or the repository is cloned again.

### Usage

To persist MinIO storage even if you remove the container or clone the repository again, set the `MINIO_DATA_DIR` environment variable. This is recommended over the default configuration, as deleting the cloned repository will result in data loss if using the default.

#### Unix-based systems (Linux, macOS):

```bash
export MINIO_DATA_DIR=~/minio/idr/data
docker-compose up
```

#### Windows (PowerShell):

```powershell
$env:MINIO_DATA_DIR = "$HOME\minio\idr\data"
docker-compose up
```

#### Windows (Command Prompt):

```cmd
set MINIO_DATA_DIR=%USERPROFILE%\minio\idr\data
docker-compose up
```
