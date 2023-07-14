import {
	createApp,
	ref,
	onMounted,
} from "https://cdnjs.cloudflare.com/ajax/libs/vue/3.3.4/vue.esm-browser.prod.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/axios/1.4.0/axios.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.9/dayjs.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.9/plugin/relativeTime.min.js";
import "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js";

createApp({
	compilerOptions: {
		delimiters: ["[[", "]]"],
	},
	setup() {
		const shopUrl = ref(null);
		const count = ref(null);
		const minRate = ref(null);
		const reviews = ref(null);
		const isFetching = ref(true);

		onMounted(async () => {
			if (count.value._value && minRate.value._value) {
				const res = await axios
					.get(
						`${shopUrl.value._value}/apps/product-reviews/reviews`,
						{
							params: {
								where: JSON.stringify({
									rating: {
										gte: parseInt(minRate.value._value),
									},
								}),
								orderBy: JSON.stringify({
									updatedAt: "desc",
								}),
								limit: count.value._value,
							},
						}
					)
					.catch((err) => console.error(err));

				switch (res.status) {
					case 200:
					case 201:
						reviews.value = res.data;
						break;

					default:
						console.error(res);
				}
			}

			isFetching.value = false;

			new Splide("#image-carousel", {
				type: "loop",
				padding: "5rem",
				drag: "free",
				autoWidth: true,
				autoScroll: {
					speed: 0.5,
				},
			}).mount(window.splide?.Extensions);
		});

		return {
			count,
			minRate,
			shopUrl,
			reviews,
			isFetching,
		};
	},
}).mount("#testimonial");
