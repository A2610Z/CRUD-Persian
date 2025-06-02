$(document).ready(function () {
    let studentsList;

    // فعال‌سازی تقویم فارسی برای فیلدهای 'add-birthday' و 'birthday'
    $('#add-birthday, #birthday').persianDatepicker({
        format: 'YYYY/MM/DD',
        initialValue: false,
        autoClose: true,
        observer: true
    });

    // دریافت داده‌های دانش‌آموز از فایل JSON محلی هنگام بارگذاری صفحه
    $.getJSON("./students.json", function (data) {
        studentsList = data.Students;

        // مقداردهی اولیه به دیتاتیبل با داده‌های دانش‌آموزان
        const table = new DataTable("#crud", {
            data: studentsList,
            processing: true,
            scrollX: true,         // فعال‌سازی اسکرول افقی
            stateSave: true,       // ذخیره وضعیت جدول (صفحه‌بندی، مرتب‌سازی و ...)
            columns: [
                { data: "Identity" },
                { data: "Name" },
                { data: "Surname" },
                { data: "Birthday" },
                {
                    // محاسبه و نمایش سن بر اساس تاریخ تولد
                    data: null,
                    render: function (data) {
                        const [year, month, day] = data.Birthday.split("-").map(Number);
                        const today = new Date();
                        let age = today.getFullYear() - year;
                        if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
                            age--;
                        }
                        return age;
                    },
                },
                { data: "Gender" },
                {
                    // دکمه‌های ویرایش درجا، ذخیره، ویرایش مدال و حذف
                    data: null,
                    defaultContent: `
                        <div class="inline-buttons">
                            <button type="button" class="btn btn-dark btn-sm inline-edit-button" title="Inline Edit">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button type="button" class="btn btn-success btn-sm save-button d-none" title="Save">
                                <i class="bi bi-check-lg"></i>
                            </button>
                            <button type="button" class="btn btn-dark btn-sm modal-edit-button" title="Modal Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm delete-button" title="Delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>`
                },
            ],
            // تنظیمات زبان فارسی برای رابط کاربری DataTables و فعال‌سازی حالت واکنش‌گرا (Responsive)
            language: {
                "emptyTable": "هیچ داده‌ای در جدول وجود ندارد",
                "info": "نمایش _START_ تا _END_ از _TOTAL_ رکورد",
                "infoEmpty": "نمایش 0 تا 0 از 0 رکورد",
                "infoFiltered": "(فیلتر شده از _MAX_ رکورد)",
                "lengthMenu": "نمایش _MENU_ رکورد",
                "loadingRecords": "در حال بارگذاری...",
                "processing": "در حال پردازش...",
                "search": "جستجو:",
                "zeroRecords": "رکوردی مطابق با جستجوی شما پیدا نشد",
                "paginate": {
                    "first": "اولین",
                    "last": "آخرین",
                    "next": "بعدی",
                    "previous": "قبلی"
                },
                "aria": {
                    "sortAscending": ": مرتب‌سازی صعودی",
                    "sortDescending": ": مرتب‌سازی نزولی"
                }
            },
            responsive: true, // فعال‌سازی حالت واکنش‌گرا برای جدول

            columnDefs: [
                {
                    targets: 3, // ستون تولد
                    render: function (data, type, row) {
                        if (!data) return "";

                        // تبدیل "YYYY/MM/DD" یا "YYYY-MM-DD" به آرایه عددی
                        const parts = data.includes("/") ? data.split("/") : data.split("-");
                        const [y, m, d] = parts.map(Number);

                        // ساخت شی persianDate از تاریخ میلادی
                        const gDate = new Date(y, m - 1, d);
                        const pDate = new persianDate(gDate);

                        return pDate.format("YYYY/MM/DD"); // نمایش شمسی
                    }
                }
            ]
        });

        // -------------------- دانلود فایل JSON --------------------
        $("#download-json-button").click(function () {
            // جلوگیری از دانلود در صورت نبود داده
            if (!studentsList || studentsList.length === 0) {
                return alert("No data to download!");
            }

            // تبدیل داده‌ها به رشته JSON و ایجاد فایل قابل دانلود
            const jsonStr = JSON.stringify({ Students: studentsList }, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "students.json";
            document.body.appendChild(link);
            link.click(); // اجرای دانلود
            document.body.removeChild(link);
        });

        // -------------------- بارگذاری فایل JSON --------------------
        $("#upload-json-button").on("click", function () {
            // فعال‌سازی انتخاب فایل
            $("#upload-json-file").click();
        });

        $("#upload-json-file").on("change", function () {
            const file = this.files[0];
            if (!file) return;

            const reader = new FileReader();

            // خواندن فایل بارگذاری شده به صورت متن
            reader.onload = function (e) {
                try {
                    const json = JSON.parse(e.target.result);

                    // اعتبارسنجی و جایگزینی داده‌ها
                    if (!json.Students) {
                        return alert("Invalid JSON: Missing 'Students' array.");
                    }

                    studentsList = json.Students;
                    table.clear(); // پاک‌سازی داده‌های قبلی
                    table.rows.add(studentsList).draw(); // بارگذاری داده‌های جدید
                } catch (err) {
                    alert("Failed to parse JSON: " + err.message);
                }
            };

            reader.readAsText(file);
            $(this).val(""); // پاک‌سازی ورودی فایل برای بارگذاری‌های بعدی
        });

        // -------------------- افزودن دانش‌آموز جدید --------------------
        $("#new-record-button").on("click", function () {
            $("#add-modal").modal("show");

            // ذخیره رکورد جدید هنگام کلیک روی دکمه ذخیره مدال
            $("#add-save-button").off("click").on("click", function () {
                const newData = {
                    Identity: $("#add-identity").val(),
                    Name: $("#add-name").val(),
                    Surname: $("#add-surname").val(),
                    Birthday: $("#add-birthday").val(),
                    Gender: $("#add-gender").val()
                };

                // افزودن رکورد جدید به دیتاتیبل و لیست دانش‌آموزان
                table.row.add(newData).draw();
                studentsList.push(newData);
                $("#add-modal").modal("hide");
            });
        });

        // -------------------- ویرایش درجا --------------------
        $("#crud tbody").on("click", ".inline-edit-button", function () {
            const row = $(this).closest("tr");
            const rowData = table.row(row).data();

            // نمایش دکمه ذخیره و مخفی کردن دکمه ویرایش درجا
            row.find(".inline-edit-button").hide();
            row.find(".save-button").removeClass("d-none");

            // جایگزینی سلول‌ها با ورودی‌های قابل ویرایش
            row.find("td:eq(0)").html(`<input class="form-control form-control-sm" type="text" value="${rowData.Identity}">`);
            row.find("td:eq(1)").html(`<input class="form-control form-control-sm" type="text" value="${rowData.Name}">`);
            row.find("td:eq(2)").html(`<input class="form-control form-control-sm" type="text" value="${rowData.Surname}">`);
            row.find("td:eq(3)").html(`<input class="form-control form-control-sm" type="text" value="${rowData.Birthday}">`);
            row.find("td:eq(5)").html(`<input class="form-control form-control-sm" type="text" value="${rowData.Gender}">`);
        });

        // -------------------- ذخیره ویرایش درجا --------------------
        $("#crud tbody").on("click", ".save-button", function () {
            const row = $(this).closest("tr");

            // جمع‌آوری مقادیر به‌روزرسانی‌شده از فیلدهای ورودی
            const updatedData = {
                Identity: row.find("td:eq(0) input").val(),
                Name: row.find("td:eq(1) input").val(),
                Surname: row.find("td:eq(2) input").val(),
                Birthday: row.find("td:eq(3) input").val(),
                Gender: row.find("td:eq(5) input").val()
            };

            const rowIndex = table.row(row).index();

            // به‌روزرسانی دیتاتیبل و لیست دانش‌آموزان
            table.row(rowIndex).data(updatedData).draw();
            const idx = studentsList.findIndex(s => s.Identity === updatedData.Identity);
            if (idx > -1) studentsList[idx] = updatedData;
        });

        // -------------------- ویرایش با مدال --------------------
        $("#crud").on("click", ".modal-edit-button", function () {
            const row = $(this).closest("tr");
            const rowData = table.row(row).data();

            // مقداردهی اولیه فیلدهای مدال با داده‌های سطر فعلی
            $("#identity").val(rowData.Identity);
            $("#name").val(rowData.Name);
            $("#surname").val(rowData.Surname);
            $("#birthday").val(rowData.Birthday);
            $("#gender").val(rowData.Gender);

            $("#edit-modal").modal("show");

            // ذخیره تغییرات هنگام کلیک روی دکمه ذخیره مدال
            $("#edit-save-button").off("click").on("click", function () {
                const updatedData = {
                    Identity: $("#identity").val(),
                    Name: $("#name").val(),
                    Surname: $("#surname").val(),
                    Birthday: $("#birthday").val(),
                    Gender: $("#gender").val()
                };

                const rowIndex = table.row(row).index();

                // به‌روزرسانی دیتاتیبل و لیست دانش‌آموزان
                table.row(rowIndex).data(updatedData).draw();
                const idx = studentsList.findIndex(s => s.Identity === updatedData.Identity);
                if (idx > -1) studentsList[idx] = updatedData;

                $("#edit-modal").modal("hide");
            });
        });

        // -------------------- حذف دانش‌آموز --------------------
        $("#crud tbody").on("click", ".delete-button", function () {
            const row = $(this).closest("tr");
            const rowData = table.row(row).data();

            // تایید حذف رکورد
            if (confirm(`Delete record for ${rowData.Identity}?`)) {
                table.row(row).remove().draw();
                studentsList = studentsList.filter(r => r.Identity !== rowData.Identity);
            }
        });
    });
});