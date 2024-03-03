#!/bin/bash
yarn migration:generate ./src/typeorm/migrations/update-database || true
yarn migration:run
yarn start:dev