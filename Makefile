# Makefile for Mouse Behaviour Annotator
# Docker and test management commands

.PHONY: help build up down restart logs shell clean test test-watch test-coverage lint

# Default target
help:
	@echo "Mouse Behaviour Annotator - Available Commands"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make build         - Build and start containers (docker compose up --build -d)"
	@echo "  make up            - Start containers in detached mode"
	@echo "  make down          - Stop and remove containers"
	@echo "  make restart       - Restart containers (down + up)"
	@echo "  make logs          - View container logs (follow mode)"
	@echo "  make shell         - Open shell in running container"
	@echo "  make clean         - Remove containers, volumes, and local images"
	@echo ""
	@echo "Test Commands:"
	@echo "  make test          - Run tests in Docker container"
	@echo "  make test-watch    - Run tests in watch mode (Docker)"
	@echo "  make test-coverage - Run tests with coverage report (Docker)"
	@echo "  make test-local    - Run tests locally (requires npm install)"
	@echo ""
	@echo "Development Commands:"
	@echo "  make install       - Install npm dependencies locally"
	@echo "  make dev           - Start development server locally"
	@echo "  make lint          - Run ESLint"

# ============================================
# Docker Commands
# ============================================

# Build and start containers in detached mode
build:
	docker compose up --build -d

# Start containers in detached mode
up:
	docker compose up -d

# Stop and remove containers
down:
	docker compose down

# Restart containers
restart: down up

# View container logs in follow mode
logs:
	docker compose logs -f

# Open shell in running container
shell:
	docker compose exec mouse-annotator sh

# Clean up everything: containers, volumes, local images, and prune
clean:
	docker compose down -v --rmi local
	docker system prune -f

# ============================================
# Test Commands (Docker)
# ============================================

# Run tests in Docker container
test:
	docker build -f Dockerfile.test -t mouse-annotator-test .
	docker run --rm mouse-annotator-test npm run test

# Run tests in watch mode in Docker container
test-watch:
	docker build -f Dockerfile.test -t mouse-annotator-test .
	docker run --rm -it mouse-annotator-test npm run test:watch

# Run tests with coverage report in Docker container
test-coverage:
	docker build -f Dockerfile.test -t mouse-annotator-test .
	mkdir -p coverage
	docker run --rm \
		-e COVERAGE_DIR=/out/report \
		-v "$(CURDIR)/coverage:/out" \
		mouse-annotator-test npm run test:coverage

# ============================================
# Local Development Commands
# ============================================

# Install npm dependencies locally
install:
	npm ci

# Run tests locally (without Docker)
test-local:
	npm run test

# Run tests in watch mode locally
test-local-watch:
	npm run test:watch

# Run tests with coverage locally
test-local-coverage:
	npm run test:coverage

# Start development server locally
dev:
	npm run dev

# Run ESLint
lint:
	npm run lint

# Build for production locally
build-local:
	npm run build
