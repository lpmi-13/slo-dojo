package main

import (
	"context"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"

	"github.com/bxcodec/faker/v4"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// product_id is created automatically via table contstraints
type FakeProductData struct {
	ProductName string `faker:"word"`
	Weight      uint8  `faker:"oneof: 10, 26, 3, 74, 22, 112, 45"`
	SKU         string `faker:"uuid_digit"`
	// we'll update these later
	SellerID int
	ColorID  int
}

type Seller struct {
	SellerID                 int
	SellerName               string
	SellerLocation           string
	TotalSuccessfulReferrals int
	OverallReviewRating      int
}

var (
	ctx       = context.TODO()
	BatchSize = 100
	db        *gorm.DB
	err       error
	// we just need an ID to map to color_id as a foreign key in the product
	// and we have 10 colors to map to
	min = 1
	max = 10
)

func main() {
	// this will create "totalLoops" * "BatchSize" amount of products per seller
	totalLoops, _ := strconv.Atoi(os.Args[1])
	dsn := "postgres://apiuser:apicontrol@localhost:5432/api"

	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	// first, lets get all the sellers, so we can loop through them and create products
	sellers, err := GetSellers()
	if err != nil {
		log.Fatalln(err)
	}

	rand.Seed(time.Now().UnixNano())

	// loop through each seller and create a bunch of products for them
	for _, s := range sellers {
		for i := 0; i < totalLoops; i++ {
			InsertDataForSeller(s.SellerID)
		}
		log.Println("added batches for:", s.SellerName)
	}

	log.Println("all finished")
}

func GetSellers() ([]Seller, error) {
	var sellers []Seller

	if result := db.Table("sellers").Find(&sellers); result.Error != nil {
		log.Println(result.Error)

		return nil, result.Error
	}

	return sellers, nil
}

func InsertDataForSeller(sellerID int) {
	productBatch := []FakeProductData{}

	for i := 0; i < BatchSize; i++ {
		product := FakeProductData{}

		err := faker.FakeData(&product)
		if err != nil {
			log.Println(err)
		}

		colorID := rand.Intn(max-min+1) + min

		product.SellerID = sellerID
		product.ColorID = colorID
		productBatch = append(productBatch, product)
	}

	err = db.Table("products").CreateInBatches(productBatch, BatchSize).Error
	if err != nil {
		log.Fatal(err)
	}
}
