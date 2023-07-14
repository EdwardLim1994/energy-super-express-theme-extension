import {
	createApp,
	ref,
	reactive,
	readonly,
	watch,
	onMounted,
	onBeforeMount,
} from "https://cdnjs.cloudflare.com/ajax/libs/vue/3.3.4/vue.esm-browser.prod.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/axios/1.4.0/axios.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.9/dayjs.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.9/plugin/relativeTime.min.js";

createApp({
	compilerOptions: {
		delimiters: ["[[", "]]"],
	},
	setup() {
		const isMobileView = readonly(
			window.matchMedia("(max-width: 576px)").matches
		);
		const modalInstance = ref(null);
		const reviewModal = ref(null);
		const formModalOperation = ref(null);
		const isSubmitting = ref(false);
		const isFetching = ref(true);
		const customerHasReviewed = ref(false);
		const isHoveringSelfReview = ref(false);
		const isUpdateChanged = ref(false);
		const reviews = ref([]);
		const shopUrl = ref(null);
		const alreadyBought = ref(0);
		const customerId = ref(null);
		const customerReview = reactive({
			id: null,
			rating: {
				confirm: false,
				value: 0,
			},
			comment: null,
		});
		const rating = reactive({
			total: 0,
			average: 0,
			count: {
				one: 0,
				two: 0,
				three: 0,
				four: 0,
				five: 0,
			},
		});

		onBeforeMount(() => {
			if (isMobileView) {
				isHoveringSelfReview.value = true;
			}
		});

		onMounted(async () => {
			if (reviewModal.value)
				modalInstance.value = new window.bootstrap.Modal(
					reviewModal.value
				);

			dayjs.extend(dayjs_plugin_relativeTime);
			const res = await axios
				.get(`${shopUrl.value._value}/apps/product-reviews/reviews`)
				.catch((err) => console.error(err));

			switch (res.status) {
				case 200:
					const reviewsFound = _.map(res.data, (item) => {
						item.updatedAt = dayjs(item.updatedAt).fromNow();
						return item;
					});

					const firstReview = _.filter(reviewsFound, (item) =>
						_.isEqual(item.customer_id, customerId.value?._value)
					);

					if (_.isEmpty(firstReview)) {
						reviews.value = reviewsFound;
					} else {
						customerHasReviewed.value = true;
						const restReviews = _.filter(
							reviewsFound,
							(item) =>
								!_.isEqual(
									item.customer_id,
									customerId.value._value
								)
						);

						reviews.value = _.union(firstReview, restReviews);
						customerReview.id = firstReview[0].id;
					}

					break;
			}

			isFetching.value = false;
		});

		watch(
			[() => customerReview.rating.value, () => customerReview.comment],
			() => {
				if (formModalOperation.value != "update") return;
				if (
					customerReview.rating.value != reviews.value[0].rating ||
					customerReview.comment != reviews.value[0].comment
				) {
					isUpdateChanged.value = true;
				} else {
					isUpdateChanged.value = false;
				}
			}
		);

		watch(formModalOperation, () => {
			switch (formModalOperation.value) {
				case "update":
					customerReview.rating.value = reviews.value[0].rating;
					customerReview.rating.confirm = true;
					customerReview.comment = reviews.value[0].comment;
					return;
				case "add":
					customerReview.rating.value = 0;
					customerReview.rating.confirm = false;
					customerReview.comment = null;
					return;

				default:
					customerReview.rating.value = 0;
					customerReview.rating.confirm = false;
					customerReview.comment = null;
			}
		});

		watch(reviews, () => {
			if (_.isEmpty(reviews.value)) return;

			rating.total = reviews.value.length;
			rating.average = _.meanBy(
				reviews.value,
				(item) => item.rating
			).toFixed(1);
			rating.count.one = _.filter(
				reviews.value,
				(item) => item.rating == 1
			).length;
			rating.count.two = _.filter(
				reviews.value,
				(item) => item.ratng == 2
			).length;
			rating.count.three = _.filter(
				reviews.value,
				(item) => item.rating == 3
			).length;
			rating.count.four = _.filter(
				reviews.value,
				(item) => item.rating == 4
			).length;
			rating.count.five = _.filter(
				reviews.value,
				(item) => item.rating == 5
			).length;
		});

		function handleOnLeaveRating() {
			if (!customerReview.rating.confirm) {
				customerReview.rating.value = 0;
			}
		}

		function handleOnSelectRating(value) {
			if (!customerReview.rating.confirm) {
				customerReview.rating.value = value;
			}
		}

		function handleResetRating() {
			customerReview.rating.confirm = false;
			customerReview.rating.value = 0;
		}

		async function handleSubmittingReview(operation, data) {
			isSubmitting.value = true;
			let res;
			switch (operation) {
				case "add":
					res = await axios
						.post(
							`${shopUrl.value._value}/apps/product-reviews/review`,
							{
								customer_id: data.customer_id.toString(),
								customer_name: data.customer_name,
								product_id: data.product_id.toString(),
								rating: customerReview.rating.value,
								comment: customerReview.comment,
							}
						)
						.catch((err) => console.error(err.message));

					break;

				case "update":
					res = await axios
						.patch(
							`${shopUrl.value._value}/apps/product-reviews/review/${customerReview.id}`,
							{
								rating: customerReview.rating.value,
								comment: customerReview.comment,
							}
						)
						.catch((err) => console.error(err.message));

					break;

				case "delete":
					res = await axios
						.delete(
							`${shopUrl.value._value}/apps/product-reviews/review/${customerReview.id}`
						)
						.catch((err) => console.error(err.message));

					break;
			}

			switch (res.status) {
				case 201:
				case 200:
					switch (operation) {
						case "add":
							reviews.value = _.union([res.data], reviews.value);
							break;

						case "update":
							const restReview = _.filter(
								reviews.value,
								(item) => item.id != customerReview.id
							);

							reviews.value = _.union([res.data], restReview);
							break;

						case "delete":
							reviews.value = _.filter(
								reviews.value,
								(item) => item.id != customerReview.id
							);

							customerReview.id = null;
							break;
					}

					modalInstance.value.hide();

					reviews.value = _.map(reviews.value, (item) => {
						item.updatedAt = dayjs(item.updatedAt).fromNow();
						return item;
					});

					formModalOperation.value = null;
					customerReview.rating.value = 0;
					customerReview.rating.confirm = false;
					customerReview.comment = null;
					break;
			}

			isSubmitting.value = false;
		}

		function handleHoverIn(id) {
			if (isMobileView) return;
			if (isHoveringSelfReview.value) return;
			if (customerId.value._value && id == customerId.value._value) {
				isHoveringSelfReview.value = true;
			}
		}

		function handleHoverOut(id) {
			if (isMobileView) return;
			if (!isHoveringSelfReview.value) return;
			if (customerId.value._value && id == customerId.value._value) {
				isHoveringSelfReview.value = false;
			}
		}

		return {
			reviewModal,
			shopUrl,
			customerHasReviewed,
			isUpdateChanged,
			isHoveringSelfReview,
			isFetching,
			isSubmitting,
			alreadyBought,
			reviews,
			rating,
			customerReview,
			customerId,
			formModalOperation,
			handleOnLeaveRating,
			handleOnSelectRating,
			handleResetRating,
			handleSubmittingReview,
			handleHoverIn,
			handleHoverOut,
		};
	},
}).mount("#product-reviews");
