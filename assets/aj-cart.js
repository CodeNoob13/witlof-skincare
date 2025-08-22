document.addEventListener("alpine:init", () => {
  Alpine.store("ajCart", {
    cartDiscount: 0,
    cart: {},
    allProducts: [],
    totalComparePrice: 0,
    setLoader: false,

    async fetchCart() {
      try {
        await this.fetchAllProducts();
        const cartRequest = await fetch("/cart.js");
        const cart = await cartRequest.json();
        this.cart = cart;

        await this.getCartProducts();
        await this.getTotalComparePrice();

        // Dispatch event for other components
        document.dispatchEvent(
          new CustomEvent("cart:updated", {
            detail: { cart: cart },
          })
        );
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    },

    async fetchAllProducts() {
      try {
        const response = await fetch("/products.json");
        const data = await response.json();
        this.allProducts = data.products;
        // console.log("All products:", this.allProducts);
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
      if (!oldQuantity) {
        return;
      }

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
      } catch (error) {
        console.error("Failed to change quantity from the cart:", error);
      }
      this.setLoader = false;
    },

    init() {
      console.log("AJ Cart initialized");
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
      console.log("Add to cart button clicked");
      setTimeout(() => {
        Alpine.store("ajCart").fetchCart();
      }, 500);
    })
  );

  if (cartAddToCartButton) {
    console.log("Add to cart button clicked");

    cartAddToCartButton.forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        setTimeout(() => {
          Alpine.store("ajCart").fetchCart();
        }, 1000);
      })
    );
  }
}
