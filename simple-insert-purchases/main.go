package main

import (
	"context"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"

	"github.com/go-faker/faker/v4"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// purchase_id is created automatically by table constraints
type Purchase struct {
	CustomerID int
	SellerID   int
	ProductID  int
	Date       string `faker:"date"`
	Price      uint16 `faker:"oneof: 4, 9, 18, 55, 102, 188, 225, 801, 3997"`
	Currency   string `faker:"currency"`
}

// customer_id is created automatically by table constraints
type GeneratedCustomer struct {
	CustomerName     string `faker:"name"`
	CustomerEmail    string `faker:"email"`
	CustomerLocation string `faker:"timezone"`
}

type RetrievedCustomer struct {
	CustomerID        int
	CustomerName      string
	CustomerEmail     string
	CustomerLocations string
}

type Seller struct {
	SellerID                 int
	SellerName               string
	SellerLocation           string
	TotalSuccessfulReferrals int
	OverallReviewRating      int
}

type RetrievedProduct struct {
	ProductID   int
	ProductName string
	Weight      int
	SKU         string
	SellerID    int
	ColorID     int
}

var (
	ctx       = context.TODO()
	BatchSize = 100
	db        *gorm.DB
	err       error
)

func GetSellers() ([]Seller, error) {
	var sellers []Seller

	if result := db.Table("sellers").Find(&sellers); result.Error != nil {
		log.Println(result.Error)

		return nil, result.Error
	}

	return sellers, nil
}

// no idea why this isn't in the standard lib
func contains(s []int, id int) bool {
	for _, v := range s {
		if v == id {
			return true
		}
	}

	return false
}

func main() {
	// this will create "totalLoops" * "BatchSize" amount of customers
	totalLoops, _ := strconv.Atoi(os.Args[1])
	dsn := "postgres://apiuser:apicontrol@localhost:5432/api"

	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal(err)
	}

	// first, lets get all the sellers, so we can loop through them and reference customers
	sellers, err := GetSellers()
	if err != nil {
		log.Fatalln(err)
	}

	for _, s := range sellers {
		for i := 0; i < totalLoops; i++ {
			InsertPurchases(s.SellerID)
		}
	}

	log.Println("all finished")
}

func InsertPurchases(sellerId int) {
	purchaseBatch := []Purchase{}

	min := 2
	max := 10

	// get a random number of purchases per customer
	rand.Seed(time.Now().UnixNano())
	numberOfPurchases := rand.Intn(max-min+1) + min

	customer := GeneratedCustomer{}

	err := faker.FakeData(&customer)
	if err != nil {
		log.Println(err)
	}

	err = db.Table("customers").Create(customer).Error
	if err != nil {
		log.Println(err)
	}

	// now let's grab the customer we just inserted so we can assign them some purchases
	insertedCustomer := RetrievedCustomer{}
	db.Table("customers").Where("customer_name = ?", customer.CustomerName).Find(&insertedCustomer)

	// create a slice to hold the products this customer has already purchased so we don't have duplicates
	var customerPurchasesByProductId []int

	// now we get the total number of products for this seller so we can randomly generate a
	// product to create a purchase for
	var products []RetrievedProduct
	result := db.Table("products").Where("seller_id = ?", sellerId).Find(&products)
	productsCount := result.RowsAffected

	for i := 0; i < numberOfPurchases; i++ {
		purchase := Purchase{}

		err := faker.FakeData(&purchase)
		if err != nil {
			log.Println(err)
		}

		product := RetrievedProduct{}

		// keep looping until we find a productID that this customer hasn't purchased yet
		for {
			randomInt := rand.Intn(int(productsCount))
			// find a product for this purchase
			db.Table("products").Where("seller_id = ?", sellerId).Offset(randomInt).Limit(1).Find(&product)

			if !contains(customerPurchasesByProductId, product.ProductID) {
				break
			}
		}

		customerPurchasesByProductId = append(customerPurchasesByProductId, product.ProductID)

		purchase.CustomerID = insertedCustomer.CustomerID
		purchase.SellerID = sellerId
		purchase.ProductID = product.ProductID

		log.Println(purchase)
		purchaseBatch = append(purchaseBatch, purchase)
	}

	err = db.Table("purchases").CreateInBatches(purchaseBatch, BatchSize).Error
	if err != nil {
		log.Fatal(err)
	}
}
