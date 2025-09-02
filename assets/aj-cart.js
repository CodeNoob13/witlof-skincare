document.addEventListener("alpine:init", () => {
  console.log("Alpine.js initializing cart store");
  Alpine.store("ajCart", {
    cartDiscount: 0,
    cart: {},
    allProducts: [],
    totalComparePrice: 0,
    setLoader: false,
    upsellProducts: [],
    openCart: false,
    freeProductThreshold: 0,
    freeSampleThreshold: 0,
    freeProductID: null,

    toggleCart() {
      this.openCart = !this.openCart;
      this.toggleBodyScroll();
    },

    openCartDrawer() {
      this.openCart = true;
      document.body.classList.add("cart-open");
    },

    closeCartDrawer() {
      this.openCart = false;
      document.body.classList.remove("cart-open");
    },

    toggleBodyScroll() {
      if (this.openCart) {
        document.body.classList.add("cart-open");
      } else {
        document.body.classList.remove("cart-open");
      }
    },

    async fetchCart() {
      try {
        this.setLoader = true;
        await this.fetchAllProducts();
        const cartRequest = await fetch("/cart.js");
        const cart = await cartRequest.json();
        this.cart = cart;
        await this.getCartProducts();
        await this.getTotalComparePrice();
        await this.getGiftSampleCount();
        await this.getFreeThresholdGiftCount();
        console.log(this.cart.cart_level_discount_applications[0]);
        await this.removeGifts();
        this.setLoader = false;
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    },

    async fetchAllProducts() {
      try {
        const response = await fetch("/products.json");
        const data = await response.json();
        this.allProducts = data.products;
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    },

    async getTotalComparePrice() {
      if (!this.cart.items) {
        return;
      }
      let comparePrice = 0;

      // Filter out any undefined items and calculate total
      this.cart.items
        .filter((item) => item)
        .forEach((item) => {
          if (item.compare_at_price && item.compare_at_price > 0) {
            comparePrice += item.compare_at_price * item.quantity;
          } else {
            comparePrice += (item.price / 100) * item.quantity;
          }
        });

      this.totalComparePrice = comparePrice;
    },

    async getCartProducts() {
      if (!this.cart.items) {
        return;
      }
      // Get total compare at price
      this.cart.items = this.cart.items.map((item) => {
        const product = this.allProducts.find((p) => p.id === item.product_id);

        if (product) {
          const variant = product.variants.find(
            (v) => v.id === item.variant_id
          );
          if (variant) {
            return {
              ...item,
              compare_at_price: variant.compare_at_price,
              available: variant.available,
            };
          }
        }
        return {
          ...item,
        };
      });
    },

    async changeQuantity(line, newQuantity, oldQuantity) {
      this.setLoader = true;

      // if (!oldQuantity) {
      //   this.setLoader = false;
      //   return;
      // }

      try {
        const response = await fetch(
          window.Shopify.routes.root + "cart/change.js",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ line: line, quantity: newQuantity }),
          }
        );

        const data = await response.json();

        await this.fetchCart();
        await this.freeThresholdGift();
      } catch (error) {
        console.error("Failed to change quantity from the cart:", error);
        this.setLoader = false; // Make sure to set loader to false even on error
      }
    },

    async addToCart(productID) {
      try {
        const response = await fetch(
          window.Shopify.routes.root + "cart/add.js",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: [
                {
                  id: productID,
                  quantity: 1,
                },
              ],
            }),
          }
        );

        const data = await response.json();
        console.log("Added to cart");
        await this.fetchCart();
        await this.freeThresholdGift();

        this.openCartDrawer();
      } catch (error) {
        console.error("Couldn't add item to cart" + error);
      }
    },

    // Start free gift threshold
    async freeThresholdGift() {
      console.log(this.cart.total_price / 100);
      console.log(this.freeProductThreshold);
      if (this.cart.total_price / 100 < this.freeProductThreshold) return;

      if (this.getFreeThresholdGiftCount() >= 1) return;

      try {
        const response = await fetch(
          window.Shopify.routes.root + "cart/add.js",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: [
                {
                  id: this.freeProductID,
                  quantity: 1,
                  properties: {
                    _freeThresholdGift: "true",
                  },
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        await this.fetchCart();
      } catch (error) {
        console.error("Couldn't add gift to cart:", error);
        this.setLoader = false;
      }
    },

    async fetchCollection(handle) {
      try {
        const response = await fetch(`/collections/${handle}/products.json`);
        const data = await response.json();
        return data.products;
      } catch (error) {
        console.error("Error fetching collection:", error);
        return [];
      }
    },

    // Start of upsell products in cart functionality
    async getUpsellProducts(id) {
      await this.fetchAllProducts();

      const matchingProduct = this.allProducts.filter(
        (product) => product.id === id
      );

      if (matchingProduct.length && matchingProduct[0].tags) {
        let nextStep = 0;
        if (matchingProduct[0].tags.includes("step-1")) {
          nextStep = "step-2";
        }
        if (matchingProduct[0].tags.includes("step-2")) {
          nextStep = "step-3";
        }
        if (matchingProduct[0].tags.includes("step-3")) {
          nextStep = "step-4";
        }
        if (matchingProduct[0].tags.includes("step-4")) {
          nextStep = "step-5";
        }
        if (nextStep) {
          this.upsellProducts = await this.fetchCollection(nextStep);
        } else {
          this.upsellProducts = await this.fetchCollection("bestsellers");
        }
      } else {
        this.upsellProducts = await this.fetchCollection("bestsellers");
      }
    },

    async addGiftProduct(productID) {
      if (this.getGiftSampleCount() === 2) return;

      this.setLoader = true;

      try {
        const response = await fetch(
          window.Shopify.routes.root + "cart/add.js",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: [
                {
                  id: productID,
                  quantity: 1,
                  properties: {
                    _gift: "true",
                  },
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        await this.fetchCart();
        // await this.freeThresholdGift();
      } catch (error) {
        console.error("Couldn't add gift to cart:", error);
        this.setLoader = false;
      }
    },

    giftInCart(id) {
      if (!this.cart.items) return false;

      const item = this.cart.items.some(
        (item) =>
          item.id == id && item.properties && item.properties._gift === "true"
      );

      return item;
    },

    async removeItem(id) {
      try {
        const response = await fetch(
          window.Shopify.routes.root + "cart/update.js",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              updates: {
                [id]: 0,
              },
            }),
          }
        );

        const data = await response.json();

        this.fetchCart();
        await this.freeThresholdGift();
      } catch (error) {
        console.error("Can't remove item from cart" + error);
      }
    },

    getGiftSampleCount() {
      if (!this.cart.items) return 0;
      return this.cart.items.filter((item) => item.properties._gift).length;
    },

    getFreeThresholdGiftCount() {
      if (!this.cart.items) return 0;
      return this.cart.items.filter(
        (item) => item.properties._freeThresholdGift
      ).length;
    },

    removeGifts() {
      if (this.cart.total_price / 100 < this.freeProductThreshold) {
        const thresholdGift = this.cart.items.filter(
          (item) =>
            item.properties && item.properties._freeThresholdGift === "true"
        );

        if (thresholdGift) {
          thresholdGift.forEach((gift) => this.removeItem(gift.id));
        }
      }

      if (this.cart.total_price / 100 < this.freeSampleThreshold) {
        const gifts = this.cart.items.filter(
          (item) => item.properties && item.properties._gift === "true"
        );

        if (gifts) {
          gifts.forEach((gift) => this.removeItem(gift.id));
        }
      }
    },

    init() {
      this.fetchCart();
    },
  });
});

// Fallback: still listen for the button click but with delay
const AddToCartButton = document.querySelectorAll(".t4s-product-form__submit");
const cartAddToCartButton = document.querySelectorAll(
  ".t4s-pr-addtocart[data-action-atc]"
);

if (AddToCartButton) {
  AddToCartButton.forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      setTimeout(() => {
        Alpine.store("ajCart")
          .fetchCart()
          .then(() => {
            Alpine.store("ajCart").openCartDrawer();
          });
      }, 1000);
    })
  );

  if (cartAddToCartButton) {
    cartAddToCartButton.forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        setTimeout(() => {
          Alpine.store("ajCart")
            .fetchCart()
            .then(() => {
              Alpine.store("ajCart").openCartDrawer();
            });
        }, 1000);
      })
    );
  }
}
