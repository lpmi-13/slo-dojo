package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

func main() {
	log.Println("making http request")

	// if you're running this locally and outside the compose stack
	// then just use `go run main.go localhost`
	connectionURI := os.Args[1]

	// we want to be able to parameterize the number of concurrent connections
	concurrentConnections, _ := strconv.Atoi(os.Args[2])

	ch := make(chan string)

	for i := 0; i < concurrentConnections; i++ {
		go sendRequest(connectionURI, ch)
	}

	for {
		go sendRequest(<-ch, ch)
	}
}

func sendRequest(url string, ch chan string) {
	time.Sleep(time.Millisecond * 300)

	res, err := http.Get("http://" + url + "/users")
	if err != nil {
		log.Fatal(err)
	}

	log.Println("got status code:", res.StatusCode)

	ch <- url
}
