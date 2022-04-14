# Uber Eats Clone Coding

Backend of Uber Eats Clone

## Core Entity

- [x] id
- [x] createdAt
- [x] updatedAt

## User Entity

- [x] email
- [x] password
- [x] role(client|owner|delivery)

## User CRUD:

- [x] Create Account
- [x] Log In
- [x] See Profile
- [x] Edit Profile
- [x] Verify Email

## Resturant Model

- [ ] Name
- [ ] Category
- [ ] Address
- [ ] Cover Image

## Restaurant CRUD

- [ ] Edit Restaurant
- [ ] Delete Restaurant

- [ ] See categories
- [ ] See Restaurants by Category (pagination)
- [ ] See Restaurants (pagination)
- [ ] See Restaurant
- [ ] Search Restaurant

- [ ] Create Dish
- [ ] Edit Dish
- [ ] Delete Dish

## Orders CRUD

- [ ] Create Order
- [ ] Read Order
- [ ] Edit Order status

## Orders Subscription

- [ ] Pending Orders (Subscription: newOrder) (trigger: createOrder(newOrder))
- [ ] Order Status (Client, Delivery, Owner) (Sub: orderUpdate) (Trigger: editOrder(orderUpdate))
- [ ] Pending Pickup Order (Delivery) (Sub: orderUpdate) (Trigger: editOrder(orderUpdate))
- [ ] Add Driver to Order

## Payment (CRON)

- [ ] Promotion the restaurant by paying
- [ ] Promotion until 7 days by CRON job
