package main

import (
	"context"
	"log"
	"os"
	"strconv"

	"github.com/go-faker/faker/v4"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// seller_id is created automatically via table constraints
type FakeSellerData struct {
	SellerName     string `faker:"url"`
	SellerLocation string `faker:"timezone"`
	// we set these both to 0 later
	TotalSuccessfulReferrals int
	OverallReviewRating      int
}

var (
	ctx       = context.TODO()
	BatchSize = 100
	db        *gorm.DB
	err       error
)

func main() {
	totalLoops, _ := strconv.Atoi(os.Args[1])
	dsn := "postgres://apiuser:apicontrol@localhost:5432/api"

	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	for i := 0; i < totalLoops; i++ {
		InsertData()

		if i%50 == 0 && i != 0 {
			log.Println("created record:", i*BatchSize)
		}
	}

	log.Println("all finished with sellers")
}

func InsertData() {
	referralBatch := []FakeSellerData{}

	for i := 0; i < BatchSize; i++ {
		referral := FakeSellerData{}

		err := faker.FakeData(&referral)
		if err != nil {
			log.Println(err)
		}

		// a bit of a kludge, but here we are
		referral.TotalSuccessfulReferrals = 0
		referral.OverallReviewRating = 0

		referralBatch = append(referralBatch, referral)
	}

	err = db.Table("sellers").CreateInBatches(referralBatch, BatchSize).Error
	if err != nil {
		log.Fatal(err)
	}
}
