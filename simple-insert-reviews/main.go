package main

import (
	"context"
	"log"

	"github.com/bxcodec/faker/v4"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type RetrievedPurchase struct {
	PurchaseID int
	CustomerID int
	SellerID   int
	ProductID  int
	reviewID   int
	Date       string
	Price      int
	Currency   string
}

type FakeReview struct {
	ReviewDate string `faker:"date"`
	ReviewText string `faker:"paragraph"`
	Rating     int    `faker:"oneof: 1, 2, 3, 4, 5"`
	// we'll set these after we grab the puchase from the database
	ReviewerID int
	ProductID  int
	PurchaseID int
}

var (
	ctx = context.TODO()
	db  *gorm.DB
	err error
)

func main() {
	dsn := "postgres://apiuser:apicontrol@localhost:5432/api"

	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	// first, lets get all the purchases, so we can loop through them and create reviews
	purchases, err := GetPurchases()
	if err != nil {
		log.Fatalln(err)
	}

	// loop through each purchase and create a review for it
	for i, p := range purchases {
		InsertDataForPurchase(p.CustomerID, p.ProductID, p.PurchaseID)
		if i%500 == 0 && i != 0 {
			log.Printf("inserted reviews for %d of %d purchases", i, len(purchases))
		}
	}

	log.Println("all finished with reviews")
}

func GetPurchases() ([]RetrievedPurchase, error) {
	var purchases []RetrievedPurchase

	if result := db.Table("purchases").Find(&purchases); result.Error != nil {
		log.Println(result.Error)

		return nil, result.Error
	}

	return purchases, nil
}

func InsertDataForPurchase(customerId int, productId int, purchaseId int) {
	review := FakeReview{}

	err := faker.FakeData(&review)
	if err != nil {
		log.Println(err)
	}

	review.ProductID = productId
	review.PurchaseID = purchaseId
	review.ReviewerID = customerId

	err = db.Table("reviews").Create(review).Error
	if err != nil {
		log.Fatal(err)
	}
}
