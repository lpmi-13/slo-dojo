package main

import (
	"log"
	"net/http"
	"os"
	"time"
)

func main() {
	log.Println("making http request")

	pauseLength := time.Second * 1

	// if you're running this locally and outside the compose stack
	// then just use `go run main.go localhost`
	connectionURI := os.Args[1]

	// this is okay for now...we'll add go routines and channels
	// later to up the load a bit
	for {
		time.Sleep(pauseLength)
		log.Println("calling /users endpoint...")

		// for this simple get users process, we don't need to
		// do anything with the response
		_, err := http.Get("http://" + connectionURI + ":3000/users")
		if err != nil {
			log.Fatal(err)
		}
	}
}
