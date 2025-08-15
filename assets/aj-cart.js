document.addEventListener("alpine:init", () => {
  Alpine.data("ajCart", () => ({
    cartPrice: 0,
    cartDiscount: 0,
    cartDiscounts: [],
    init() {
      this.fetchCart();
      document.addEventListener("cart:refresh", () => {
        this.fetchCart();
      });
      document.addEventListener("cart:updated", () => {
        this.fetchCart();
      });
      document.addEventListener("cart:change", () => {
        this.fetchCart();
      });
      document.addEventListener("cart:requestComplete", () => {
        this.fetchCart();
      });
    },
    fetchCart() {
      fetch("/cart.js")
        .then((res) => res.json())
        .then((cart) => {
          this.cartPrice = cart.total_price / 100;
          this.cartDiscount = cart.total_discount / 100;
          this.cartDiscounts = cart.cart_level_discount_applications || [];
        });
    },
  }));

  // Add ajCart to Alpine store for global access
  Alpine.store("ajCart", {
    cartPrice: 0,
    cartDiscount: 0,
    cartDiscounts: [],
    fetchCart() {
      fetch("/cart.js")
        .then((res) => res.json())
        .then((cart) => {
          this.cartPrice = cart.total_price / 100;
          this.cartDiscount = cart.total_discount / 100;
          this.cartDiscounts = cart.cart_level_discount_applications || [];
        });
    },
  });
});
