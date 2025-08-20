document.addEventListener("alpine:init", async () => {
  Alpine.data("ajCart", () => ({
    cartPrice: 0,
    cartDiscount: 0,
    cart: {},
    allProducts: [],
    totalComparePrice: 0,

    init() {
      this.fetchCart();
      document.addEventListener("cart:refresh", async () => {});
      document.addEventListener("cart:updated", async () => {
        this.fetchCart();
      });
      document.addEventListener("cart:change", async () => {
        this.fetchCart();
      });
      document.addEventListener("cart:requestComplete", async () => {
        this.fetchCart();
      });
    },
    async fetchCart() {
      this.fetchAllProducts();

      fetch("/cart.js")
        .then((res) => res.json())
        .then((cart) => {
          this.cart = cart;
          this.cartPrice = cart.total_price / 100;
          console.log(this.cart.item_count);
          this.getCartProducts();
          this.getTotalComparePrice();
        });
    },

    async getCartProducts() {
      // Get total compare at price
      this.cartProducts = this.cart.items.map((item) => {
        const product = this.allProducts.find((p) => p.id === item.product_id);
        if (product) {
          const variant = product.variants.find(
            (v) => v.id === item.variant_id
          );
          if (variant) {
            return {
              ...item,
              compare_at_price: parseFloat(variant.compare_at_price) || 0,
            };
          }
        }
        // Return item with fallback compare_at_price if product/variant not found
        return {
          ...item,
          compare_at_price: 0,
        };
      });
    },

    async getTotalComparePrice() {
      let totalComparePrice = 0;

      // Filter out any undefined items and calculate total
      this.cartProducts
        .filter((item) => item)
        .forEach((item) => {
          if (item.compare_at_price && item.compare_at_price > 0) {
            totalComparePrice += item.compare_at_price * item.quantity;
          } else {
            totalComparePrice += (item.price / 100) * item.quantity;
          }
        });

      this.totalComparePrice = totalComparePrice;

      console.log(this.totalComparePrice);
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
