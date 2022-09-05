function Validator(formSelector, options) {
	//Gán giá trị mặc định cho tham số (ES5)
	if (!options) {
		options = {};
	}

	function getParent(element, selector) {
		while (element.parentElement) {
			if (element.parentElement.matches(selector)) {
				return element.parentElement;
			}
			element = element.parentElement;
		}
	}

	var formRules = {};
	/*
	 * Quy ước tạo rule:
	 * - Nếu có lỗi thì return `error mesage`
	 * - Nếu không có lỗi thì return `undefined`
	 */
	var validatorRules = {
		required: function (value) {
			return value ? undefined : 'Vui lòng nhập trường này!';
		},
		email: function (value) {
			var regex =
				/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
			return regex.test(value) ? undefined : 'Vui lòng nhập email!';
		},
		min: function (min) {
			return function (value) {
				return value.length >= min
					? undefined
					: `Vui lòng nhập ít nhất ${min} ký tự`;
			};
		},
		max: function (max) {
			return function (value) {
				return value.length <= max
					? undefined
					: `Vui lòng nhập tối đa ${max} ký tự`;
			};
		},
	};

	//Lấy ra form element trong DOM theo formSelector
	var formElement = document.querySelector(formSelector);

	// CHỉ xử lý khi có element trong DOM
	if (formElement) {
		var inputs = formElement.querySelectorAll('[name][rules]');

		for (var input of inputs) {
			var rules = input.getAttribute('rules').split('|');

			for (var rule of rules) {
				var ruleInfo;
				var isRuleHasValue = rule.includes(':');

				if (isRuleHasValue) {
					ruleInfo = rule.split(':');
					rule = ruleInfo[0];
				}

				var rulefunc = validatorRules[rule];

				if (isRuleHasValue) {
					rulefunc = rulefunc(ruleInfo[1]);
				}

				if (Array.isArray(formRules[input.name])) {
					formRules[input.name].push(rulefunc);
				} else {
					formRules[input.name] = [rulefunc];
				}
			}

			//Lắng nghe sự kiện đê Validate (blur, change,...)
			input.onblur = handleValidate;
			input.oninput = handleClearError;
		}
		function handleValidate(event) {
			var rules = formRules[event.target.name];
			var errorMessage;

			rules.find(function (rule) {
				errorMessage = rule(event.target.value);
				return errorMessage;
			});

			//Nếu có lỗi thi hiển thị message ra UI
			if (errorMessage) {
				var formGroup = getParent(event.target, '.form-group');

				if (formGroup) {
					formGroup.classList.add('invalid');

					var formMessage = formGroup.querySelector('.form-message');
					if (formMessage) {
						formMessage.innerText = errorMessage;
					}
				}
			}
			return !errorMessage; //true
		}

		//Hàm clear message lỗi
		function handleClearError(event) {
			var formGroup = getParent(event.target, '.form-group');
			if (formGroup.classList.contains('invalid')) {
				formGroup.classList.remove('invalid');

				var formMessage = formGroup.querySelector('.form-message');
				if (formMessage) {
					formMessage.innerText = '';
				}
			}
		}
	}

	//XỬ lý hành vi submit form
	formElement.onsubmit = function (event) {
		event.preventDefault();

		var inputs = formElement.querySelectorAll('[name][rules]');
		var isValid = true;

		for (var input of inputs) {
			if (!handleValidate({ target: input })) {
				isValid = false;
			}
		}

		//So sanh password va confirm password
		function getConfirmValue() {
			if (
				document.getElementById('password').value ===
				document.getElementById('password-confirmation').value
			) {
				document.getElementsByClassName('form-submit').innerHTML = 'match';
			} else {
				document.getElementsByClassName('form-submit').innerHTML = 'no match';
			}
		}

		getConfirmValue();

		//Khi không có lỗi thì submit form
		if (isValid) {
			if (typeof options.onSubmit === 'function') {
				var enableInputs = formElement.querySelectorAll('[name]');
				var formValues = Array.from(enableInputs).reduce(function (
					values,
					input
				) {
					switch (input.value) {
						case 'radio':
							values[input.name] = formElement.querySelector(
								'input[name="' + input.name + '"]checked'
							).value;
							break;
						case 'checkbox':
							if (!input.matches(':checked')) {
								values[input.name] = '';
								return values;
							}
							if (!Array.isArray(values[input.name])) {
								values[input.name] = [];
							}
							values[input.name] = push(input.name);
							break;
						case 'file':
							values[input.name] = input.files;
							break;
						default:
							values[input.name] = input.value;
					}
					return values;
				},
				{});

				//Gọi lại hàm onSubmit và trả về kèm giá trị của form
				options.onSubmit(formValues);
			} else {
				formElement.submit();
			}
		}
	};
}
