#! /bin/bash

cd simple-insert-sellers && go run main.go 5 && cd ..

cd simple-insert-products && go run main.go 5 && cd ..

cd simple-insert-purchases && go run main.go 5 && cd ..

cd simple-insert-reviews && go run main.go && cd ..

cd simple-insert-referrals && go run main.go
