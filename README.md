# Uber Eats Clone Coding

Backend of Uber Eats Clone

## Core Entity
- [ ] id
- [ ] createdAt
- [ ] updatedAt
  
## User Entity
- [ ] email
- [ ] password
- [ ] role(client|owner|delivery)

## User CRUD:
- [ ] Create Account
- [ ] Log In
- [ ] See Profile
- [ ] Edit Profile
- [ ] Verify Email

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