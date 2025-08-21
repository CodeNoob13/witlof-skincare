jQuery_T4NT(document).ready(function ($) {
  /**
   *  Variant selection changed
   *  data-variant-toggle="{{ variant.id }}"
   */
  $(document).on("variant:changed", function (evt) {
    // console.log( evt.currentVariant );
    // $('[data-variant-toggle]').hide(0);
    // $('[data-variant-toggle="'+evt.currentVariant.id+'"]').show(0);
  });

  /**
   * Fix for cart quantity updates using proper line index
   * instead of DOM position which changes when items are reordered
   */
  function updateCartLineItem(element, lineIndex, quantity) {
    console.log("Updating cart line:", lineIndex, "with quantity:", quantity);

    var cartItem = element.closest("[data-cart-item]");
    var cartWrapper = element.closest("[data-cart-wrapper]");
    var loadingBar = cartItem.find(".t4s-cart-ld__bar");
    var spinner = loadingBar.find(".t4s-cart-spinner");

    cartWrapper.addClass("is--contentUpdate");
    cartItem.addClass("is--update");
    loadingBar.removeAttr("hidden");
    spinner.removeAttr("hidden");

    $(document).on("cart:updated", function () {
      cartWrapper.removeClass("is--contentUpdate");
      $(document).off("cart:updated");
      cartItem.removeClass("is--update");
      loadingBar.attr("hidden", "");
      spinner.attr("hidden", "");
    });

    var requestConfig = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/javascript",
      },
    };

    var sections = "cart_data,mini_cart";
    var requestData = {
      line: lineIndex,
      quantity: quantity,
      sections: sections,
      sections_url: window.location.pathname,
    };

    requestConfig.body = JSON.stringify(requestData);

    fetch("/cart/change.js", requestConfig)
      .then((response) => response.json())
      .then((data) => {
        if (data.status) {
          console.error("Cart update error:", data.description);
          $(document).trigger("cart:updated", ["error"]);
        } else {
          console.log("Cart update successful");
          if (
            window.T4SThemeSP &&
            window.T4SThemeSP.Cart &&
            window.T4SThemeSP.Cart.renderContents
          ) {
            window.T4SThemeSP.Cart.renderContents(data.sections);
          }
        }
      })
      .catch((error) => {
        console.error("Cart update error:", error);
        $(document).trigger("cart:updated", ["error"]);
      });
  }

  //   // Override the default cart change handler with line-index-aware version
  //   $(document).on(
  //     "change",
  //     "[data-cart-items] [data-action-change]",
  //     function (e) {
  //       e.stopImmediatePropagation(); // Prevent default handler

  //       var input = $(this);
  //       var cartItem = input.closest("[data-cart-item]");
  //       var lineIndex = cartItem.data("line-index");
  //       var quantity = input.val() || 1;

  //       console.log("Cart quantity changed:", {
  //         lineIndex: lineIndex,
  //         quantity: quantity,
  //         productId: cartItem.data("pid"),
  //       });

  //       if (lineIndex && window.T4SThemeSP && window.T4SThemeSP.ProductAjax) {
  //         updateCartLineItem(input, lineIndex, quantity);
  //       }
  //     }
  //   );

  // Also handle quantity selector buttons with line index
  $(document).on(
    "click",
    "[data-cart-items] [data-quantity-selector]",
    function (e) {
      //   e.preventDefault();
      e.stopImmediatePropagation();

      var button = $(this);
      var quantityWrapper = button.closest("[data-quantity-wrapper]");
      var quantityInput = quantityWrapper.find("[data-quantity-value]");
      var cartItem = button.closest("[data-cart-item]");
      var lineIndex = cartItem.data("line-index");

      console.log("Quantity selector clicked:", {
        lineIndex: lineIndex,
        isIncrease: button.is("[data-increase-qty]"),
        productId: cartItem.data("pid"),
      });

      if (!lineIndex) return;

      var currentQty = parseFloat(quantityInput.val()) || 0;
      var maxQty = parseFloat(quantityInput.attr("max")) || 9999;
      var minQty = parseFloat(quantityInput.attr("min")) || 1;
      var step = parseFloat(quantityInput.attr("step")) || 1;

      var newQty;
      if (button.is("[data-increase-qty]")) {
        newQty = Math.min(currentQty + 1);
      } else {
        newQty = Math.max(currentQty - 1);
      }

      quantityInput.val(newQty);

      if (window.T4SThemeSP && window.T4SThemeSP.ProductAjax) {
        updateCartLineItem(quantityInput, lineIndex, newQty);
      }
    }
  );
});
