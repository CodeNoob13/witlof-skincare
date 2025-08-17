document.addEventListener("alpine:init", () => {
  Alpine.data("ajCart", () => ({
    cartPrice: 0,
    cartDiscount: 0,
    cartProducts: [],
    allProducts: [],
    totalComparePrice: 0,

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
      this.fetchAllProducts();

      fetch("/cart.js")
        .then((res) => res.json())
        .then((cart) => {
          this.cartPrice = cart.total_price / 100;
          this.cartDiscount = cart.total_discount / 100;
          this.cartProducts = cart.items.map((item) => {
            const product = this.allProducts.find((p) => p.id === item.id);
            return {
              ...item,
              ...product,
            };
          });

          this.allProducts.forEach((product) => {
            console.log(product.variants);
          });

          // Get total compare at price

          this.getTotalComparePrice();
          console.log((this.totalComparePrice / 100).toFixed(2));
        });
    },

    async getTotalComparePrice() {
      let totalComparePrice = 0;

      this.cartProducts.forEach((item) => {
        if (item.compare_at_price && item.quantity === 1) {
          totalComparePrice += item.compare_at_price;
        } else if (item.compare_at_price && item.quantity > 1) {
          totalComparePrice += item.compare_at_price * item.quantity;
        } else {
          totalComparePrice += item.line_price;
        }
      });
      this.totalComparePrice = totalComparePrice;
    },

    fetchAllProducts() {
      fetch("/products.json")
        .then((response) => response.json())
        .then((data) => {
          this.allProducts = data.products;
          // console.log("All products:", this.allProducts);
        })
        .catch((error) => {
          console.error("Error fetching products:", error);
        });
    },
  }));
});
