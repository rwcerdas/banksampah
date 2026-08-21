import WasteBankCustomer from '../models/wasteBankCustomer.model.mjs';
import WasteBankTransaction from '../models/wasteBankTransaction.model.mjs';
import WasteBankWithdrawal from '../models/wasteBankWithdrawal.model.mjs';
import User from '../models/user.model.mjs';
import bcrypt from 'bcryptjs';
import AuditTrailService from '../services/auditTrail.service.mjs';

export const registerNasabah = async (req, res) => {
    let newUser = null;

    try {
        const {
            customerType,
            nik,
            username,
            password,
            fullName,
            address,
            rt,
            rw,
            phone,
            kelurahan,
            kecamatan,
            groupDetails,
            createLogin = true,
        } = req.body;

        const type = customerType || 'INDIVIDUAL';

        if (type === 'INDIVIDUAL') {
            if (!fullName || !phone || !address || !rt || !rw) {
                throw new Error('Nama, No HP, Alamat, RT, dan RW wajib diisi');
            }

            if (nik) {
                const existingNik = await WasteBankCustomer.findOne({ nik });
                if (existingNik) throw new Error('NIK ini sudah terdaftar sebagai nasabah');
            }

            const duplicate = await WasteBankCustomer.findOne({ phone, name: fullName, isActive: true });
            if (duplicate) throw new Error('Nasabah dengan nama dan nomor HP ini sudah terdaftar');

            const year = new Date().getFullYear();
            const lastCustomer = await WasteBankCustomer.findOne({
                accountNumber: { $regex: `^BS-${year}` },
            }).sort({ accountNumber: -1 });
            const nextNumber = lastCustomer
                ? parseInt(lastCustomer.accountNumber.split('-')[2], 10) + 1
                : 1;
            const accountNumber = `BS-${year}-${String(nextNumber).padStart(4, '0')}`;

            if (createLogin && username && password) {
                const existingUser = await User.findOne({ username: username.toLowerCase() });
                if (existingUser) throw new Error('Username sudah digunakan');

                const hashedPassword = await bcrypt.hash(password, 10);
                newUser = await User.create({
                    username: username.toLowerCase(),
                    password_hash: hashedPassword,
                    fullName,
                    nama_lengkap: fullName,
                    role: 'nasabah',
                    mustChangePassword: true,
                });
            }

            const newCustomer = await WasteBankCustomer.create({
                userId: newUser?._id || null,
                customerType: 'INDIVIDUAL',
                dataSource: 'MANUAL_ENTRY',
                accountNumber,
                nik: nik || null,
                name: fullName,
                address,
                rt,
                rw,
                kelurahan,
                kecamatan,
                phone,
                locality: 'EXTERNAL',
                isLinked: !!newUser,
                createdBy: req.user?.username || 'admin',
                isActive: true,
            });

            if (newUser) {
                newUser.customerId = newCustomer._id;
                await newUser.save();
            }

            if (req.user) {
                await AuditTrailService.logActivity({
                    user_id: req.user.id,
                    username: req.user.username,
                    user_role: req.user.role,
                    action: 'CREATE',
                    resource: 'Customer',
                    resource_id: newCustomer._id,
                    description: `Mendaftarkan nasabah: ${fullName}`,
                    status: 'success',
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Nasabah berhasil didaftarkan',
                data: {
                    customer: newCustomer,
                    user: newUser ? { username: newUser.username, role: newUser.role } : null,
                },
            });
        }

        if (type === 'GROUP') {
            if (!groupDetails?.groupName) throw new Error('Nama kelompok wajib diisi');
            if (!groupDetails?.picName || !groupDetails?.picPhone) {
                throw new Error('Nama dan No HP Penanggung Jawab wajib diisi');
            }
            if (!rw) throw new Error('RW wajib diisi');

            const year = new Date().getFullYear();
            const lastGroup = await WasteBankCustomer.findOne({
                accountNumber: { $regex: `^GRP-${year}` },
            }).sort({ accountNumber: -1 });
            const nextNumber = lastGroup
                ? parseInt(lastGroup.accountNumber.split('-')[2], 10) + 1
                : 1;
            const accountNumber = `GRP-${year}-${String(nextNumber).padStart(3, '0')}`;

            const newCustomer = await WasteBankCustomer.create({
                customerType: 'GROUP',
                dataSource: 'MANUAL_ENTRY',
                accountNumber,
                name: groupDetails.groupName,
                phone: groupDetails.picPhone,
                address: address || `Sekretariat ${groupDetails.groupName}`,
                rt,
                rw,
                kelurahan,
                kecamatan,
                groupDetails: {
                    groupName: groupDetails.groupName,
                    organizationType: groupDetails.organizationType || 'OTHER',
                    totalMembers: groupDetails.totalMembers || 0,
                    picNik: groupDetails.picNik || null,
                    picName: groupDetails.picName,
                    picRole: groupDetails.picRole || 'Ketua',
                    picPhone: groupDetails.picPhone,
                },
                balance: 0,
                locality: 'EXTERNAL',
                isActive: true,
                createdBy: req.user?.username || 'admin',
            });

            return res.status(201).json({
                success: true,
                message: 'Nasabah kelompok berhasil didaftarkan',
                data: { customer: newCustomer },
            });
        }

        throw new Error('Tipe nasabah tidak valid');
    } catch (error) {
        if (newUser?._id) await User.findByIdAndDelete(newUser._id);
        console.error('Error registering nasabah:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Gagal mendaftarkan nasabah',
        });
    }
};

export const getCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', active, customerType, rt, rw } = req.query;

        const query = {};

        // Search by name or account number
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { accountNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by active status
        if (active !== undefined) {
            query.isActive = active === 'true';
        }

        // Filter by customer type
        if (customerType && customerType !== 'all') {
            query.customerType = customerType.toUpperCase();
        }

        // Filter by RT/RW
        if (rt) query.rt = rt;
        if (rw) query.rw = rw;

        const customers = await WasteBankCustomer.find(query)
            .sort({ lastTransactionDate: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('userId', 'username') // Populate linked user
            .lean();

        const count = await WasteBankCustomer.countDocuments(query);

        // Fetch unique RTs and RWs for filters
        const [uniqueRTs, uniqueRWs] = await Promise.all([
            WasteBankCustomer.distinct('rt', { rt: { $ne: null, $ne: "" } }),
            WasteBankCustomer.distinct('rw', { rw: { $ne: null, $ne: "" } })
        ]);

        res.json({
            success: true,
            data: customers,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            },
            filters: {
                rts: uniqueRTs.sort(),
                rws: uniqueRWs.sort()
            }
        });
    } catch (error) {
        console.error('Error getting customers:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data nasabah',
            error: error.message
        });
    }
};

export const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await WasteBankCustomer.findById(id).lean();

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Nasabah tidak ditemukan'
            });
        }

        // Get recent transactions
        const transactions = await WasteBankTransaction.find({
            customerId: id,
            status: 'COMPLETED'
        })
            .sort({ transactionDate: -1 })
            .limit(10)
            .lean();

        // Get recent withdrawals
        const withdrawals = await WasteBankWithdrawal.find({
            customerId: id,
            status: 'COMPLETED'
        })
            .sort({ withdrawalDate: -1 })
            .limit(10)
            .lean();

        res.json({
            success: true,
            data: {
                ...customer,
                recentTransactions: transactions,
                recentWithdrawals: withdrawals
            }
        });
    } catch (error) {
        console.error('Error getting customer:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data nasabah',
            error: error.message
        });
    }
};

export const createCustomer = async (req, res) => {
    try {
        const { accountNumber, name, address, phone, rt, rw } = req.body;

        // Check if account number already exists
        const existing = await WasteBankCustomer.findOne({ accountNumber });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Nomor rekening sudah digunakan'
            });
        }

        const customer = new WasteBankCustomer({
            accountNumber,
            name,
            address,
            phone,
            rt,
            rw,
            createdBy: req.user?.username || 'system'
        });

        await customer.save();

        res.status(201).json({
            success: true,
            message: 'Nasabah berhasil ditambahkan',
            data: customer
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan nasabah',
            error: error.message
        });
    }
};

export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { accountNumber, name, address, phone, rt, rw, isActive, locality, kelurahan, kecamatan } = req.body;

        // Validate phone number format if provided
        if (phone !== undefined && phone !== null && phone !== '') {
            const phoneRegex = /^(08|628)\d{8,11}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Format nomor HP tidak valid. Gunakan format 08xxx atau 628xxx (10-13 digit)'
                });
            }
        }

        // Validate address if provided
        if (address !== undefined && address !== null && address.trim() !== '') {
            if (address.trim().length < 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Alamat minimal 5 karakter'
                });
            }
        }

        // If updating account number, check uniqueness
        if (accountNumber) {
            const existing = await WasteBankCustomer.findOne({
                accountNumber,
                _id: { $ne: id }
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Nomor rekening sudah digunakan'
                });
            }
        }

        // Prepare update data (only include fields that are provided)
        const updateData = {};
        if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
        if (name !== undefined) updateData.name = name;
        if (address !== undefined) updateData.address = address?.trim();
        if (phone !== undefined) updateData.phone = phone;
        if (rt !== undefined) updateData.rt = rt;
        if (rw !== undefined) updateData.rw = rw;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (locality !== undefined) updateData.locality = locality;
        if (kelurahan !== undefined) updateData.kelurahan = kelurahan;
        if (kecamatan !== undefined) updateData.kecamatan = kecamatan;

        const customer = await WasteBankCustomer.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Nasabah tidak ditemukan'
            });
        }

        // If customer is a GROUP and phone changed, also update groupDetails.picPhone
        if (customer.customerType === 'GROUP' && phone !== undefined && customer.groupDetails) {
            customer.groupDetails.picPhone = phone;
            await customer.save();
        }

        // Log audit trail untuk waste bank customer update
        if (req.user) {
            await AuditTrailService.logActivity({
                user_id: req.user.id,
                username: req.user.username,
                user_role: req.user.role,
                action: 'UPDATE',
                resource: 'WasteBankCustomer',
                resource_id: customer._id,
                description: `Mengupdate data nasabah: ${customer.name} (${customer.accountNumber})`,
                ip_address: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
                user_agent: req.headers['user-agent'],
                metadata: {
                    updated_customer: {
                        accountNumber: customer.accountNumber,
                        name: customer.name,
                        phone: customer.phone,
                        isActive: customer.isActive
                    },
                    method: req.method,
                    endpoint: req.originalUrl
                },
                status: 'success'
            });
        }

        res.json({
            success: true,
            message: 'Nasabah berhasil diupdate',
            data: customer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengupdate nasabah',
            error: error.message
        });
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete
        const customer = await WasteBankCustomer.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Nasabah tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Nasabah berhasil dinonaktifkan'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus nasabah',
            error: error.message
        });
    }
};

// ============================================
// CATEGORY MANAGEMENT
// ============================================
