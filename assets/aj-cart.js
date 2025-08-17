document.addEventListener("alpine:init", () => {
  Alpine.data("ajCart", () => ({
    cartPrice: 0,
    cartWithoutDiscount: 0,
    cartDiscount: 0,

    allProducts: [],

    init() {
      this.fetchCart();
      document.addEventListener("cart:refresh", () => {});
      document.addEventListener("cart:updated", () => {
        this.fetchCart();
        this.fetchProducts();
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
          this.cartWithoutDiscount = this.cartPrice + this.cartDiscount;
          this.fetchProducts();
          console.log(this.cartWithoutDiscount);
        });
    },
    fetchProducts() {
      fetch("/products.json")
        .then((res) => res.json())
        .then((data) => {
          this.allProducts = data.products[0];
        });
    },
  }));
});
