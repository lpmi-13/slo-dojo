package main

import (
	"context"
	"log"
	"math/rand"
	"time"

	"github.com/bxcodec/faker/v4"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type RetrievedPurchase struct {
	PurchaseID int
	CustomerID int
	SellerID   int
	ProductID  int
	referralID int
	Date       string
	Price      int
	Currency   string
}

type RetrievedCustomer struct {
	CustomerID       int
	CustomerName     string
	CustomerEmail    string
	CustomerLocation string
}

type FakeReferral struct {
	ReferralOfferDate string `faker:"date"`
	// we'll set these after we grab the puchase from the database
	ReferralAccepted bool
	SellerID         int
	ReferrerID       int
	ReferreeID       int
}

var (
	ctx       = context.TODO()
	BatchSize = 3
	db        *gorm.DB
	err       error
)

func main() {
	dsn := "postgres://apiuser:apicontrol@localhost:5432/api"

	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	customers, err := GetCustomers()
	if err != nil {
		log.Fatalln(err)
	}

	// loop through each customer and find one of their purchases
	for i, c := range customers {
		purchase := RetrievedPurchase{}
		db.Table("purchases").Where("customer_id = ?", c.CustomerID).Limit(1).Find(&purchase)

		// we're only passing in one customer ID, since we'll just find one - three other customers
		// in the database who HAVEN'T yet purchased from this seller to be the referees
		InsertDataForReferral(c.CustomerID, purchase.SellerID)

		if i%50 == 0 && i != 0 {
			log.Printf("inserted referrals for %d of %d customers", i, len(customers))
		}
	}

	log.Println("all finished with reviews")
}

// need to refactor this out into a utility file or something
// once we get all the data-insertion code in one place
func contains(s []int, id int) bool {
	for _, v := range s {
		if v == id {
			return true
		}
	}

	return false
}

// I guess this is too simple to add in faker
func randomBoolGenerator() bool {
	rand.Seed(time.Now().UnixNano())
	return rand.Intn(2) == 1
}

func GetCustomers() ([]RetrievedCustomer, error) {
	var customers []RetrievedCustomer

	totalCustomersToRefer := 500

	// just get 500, since we just need some fake data in there
	if result := db.Table("customers").Limit(totalCustomersToRefer).Find(&customers); result.Error != nil {
		log.Println(result.Error)

		return nil, result.Error
	}

	return customers, nil
}

func getNonCustomerPurchases(sellerId int) ([]RetrievedPurchase, error) {
	var nonCustomerPurchases []RetrievedPurchase

	if result := db.Table("purchases").Where("seller_id != ?", sellerId).Find(&nonCustomerPurchases); result.Error != nil {
		log.Println(result.Error)

		return nil, result.Error
	}

	return nonCustomerPurchases, nil
}

func InsertDataForReferral(customerId int, sellerId int) {
	referralBatch := []FakeReferral{}

	nonCustomerPurchases, err := getNonCustomerPurchases(sellerId)
	if err != nil {
		log.Println(err)
	}

	// hold the customers we've already referred
	var referredCustomers []int

	// we'll send out 3 referrals per customer
	for i := 0; i < BatchSize; i++ {
		nonReferredCustomer := RetrievedCustomer{}

		// keep looping until we find a nonCustomer that this customer hasn't referred yet
		for {
			randomInt := rand.Intn(len(nonCustomerPurchases))
			// find a product for this purchase
			db.Table("purchases").Where("seller_id != ?", sellerId).Offset(randomInt).Limit(1).Find(&nonReferredCustomer)

			if !contains(referredCustomers, nonReferredCustomer.CustomerID) {
				break
			}
		}

		referredCustomers = append(referredCustomers, nonReferredCustomer.CustomerID)

		referral := FakeReferral{}

		err := faker.FakeData(&referral)
		if err != nil {
			log.Println(err)
		}

		referral.SellerID = sellerId
		referral.ReferrerID = customerId
		referral.ReferreeID = nonReferredCustomer.CustomerID
		referral.ReferralAccepted = randomBoolGenerator()
		referralBatch = append(referralBatch, referral)
	}

	err = db.Table("referrals").CreateInBatches(referralBatch, BatchSize).Error
	if err != nil {
		log.Fatal(err)
	}
}
