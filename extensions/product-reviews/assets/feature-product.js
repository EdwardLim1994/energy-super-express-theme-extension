import {
	createApp,
	ref,
	reactive,
	onMounted,
} from "https://cdnjs.cloudflare.com/ajax/libs/vue/3.3.4/vue.esm-browser.prod.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/axios/1.4.0/axios.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js";

createApp({
	compilerOptions: {
		delimiters: ["[[", "]]"],
	},
	setup() {
		const featuredProductsId = ref(null);
		const rating = reactive({
			average: null,
			total: null,
		});
		const shopUrl = ref(null);

		onMounted(async () => {
			const res = await axios
				.get(`${shopUrl.value._value}/apps/product-reviews/reviews`, {
					params: {
						where: JSON.stringify({
							product_id: {
								in: featuredProductsId.value._value
									.split(",")
									.map((id) => id),
							},
						}),
					},
				})
				.catch((err) => console.error(err));

			switch (res.status) {
				case 200:
				case 201:
					rating.total = res.data.length;
					rating.average = _.meanBy(
						res.data,
						(item) => item.rating
					).toFixed(1);
					break;
			}
		});
		return {
			featuredProductsId,
			rating,
			shopUrl,
		};
	},
}).mount("#feature-product");
