<template>
<!-- Add/Edit Modal -->
<teleport to="body">
  <div v-if="showModal" @click="showModal = false" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div @click.stop class="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Nasabah' : 'Tambah Nasabah' }}
        </h3>
      </div>
      <form @submit.prevent="handleSubmit" class="p-6">
        <div class="space-y-4">

          <!-- CUSTOMER TYPE TOGGLE (Only for New Registration) -->
          <div v-if="!isEditing" class="mb-4">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tipe Nasabah</label>
            <div class="flex gap-4">
              <label class="flex items-center cursor-pointer">
                <input type="radio" v-model="customerType" value="INDIVIDUAL" class="mr-2" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Perorangan</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input type="radio" v-model="customerType" value="GROUP" class="mr-2" />
                <span class="text-sm text-gray-700 dark:text-gray-300">👥 Kelompok/Organisasi</span>
              </label>
            </div>
          </div>

          <!-- DATA SOURCE SELECTOR (hidden - EcoBank uses manual entry only) -->
          <div v-if="false" class="mb-6">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Asal Nasabah</label>
            <div class="grid grid-cols-2 gap-3">
              <label
                :class="[
                  'relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all',
                  dataSource === 'HOUSEHOLD_DB'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
                ]"
              >
                <input type="radio" v-model="dataSource" value="HOUSEHOLD_DB" class="sr-only" />
                <div class="flex items-center space-x-3">
                  <div :class="[
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl',
                    dataSource === 'HOUSEHOLD_DB' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  ]">
                    🏠
                  </div>
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">Warga RW 09</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">Data otomatis dari KK</div>
                  </div>
                </div>
                <div v-if="dataSource === 'HOUSEHOLD_DB'" class="absolute top-2 right-2">
                  <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
              </label>

              <label
                :class="[
                  'relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all',
                  dataSource === 'MANUAL_ENTRY'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                ]"
              >
                <input type="radio" v-model="dataSource" value="MANUAL_ENTRY" class="sr-only" />
                <div class="flex items-center space-x-3">
                  <div :class="[
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl',
                    dataSource === 'MANUAL_ENTRY' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  ]">
                    🌐
                  </div>
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">Input Manual</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">Data nasabah umum</div>
                  </div>
                </div>
                <div v-if="dataSource === 'MANUAL_ENTRY'" class="absolute top-2 right-2">
                  <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
              </label>
            </div>

            <!-- NEW: Locality Switcher (Internal/External) -->
            <div v-if="dataSource === 'MANUAL_ENTRY'" class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <label class="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Wilayah Nasabah</label>
              <div class="flex gap-4">
                <label class="flex items-center cursor-pointer p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition">
                  <input type="radio" v-model="locality" value="INTERNAL" class="mr-2" />
                  <div class="text-sm">
                    <span class="font-bold text-green-600 block">Internal RW 09</span>
                    <span class="text-xs text-gray-500">Masuk analitik RW 09</span>
                  </div>
                </label>
                <label class="flex items-center cursor-pointer p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition">
                  <input type="radio" v-model="locality" value="EXTERNAL" class="mr-2" />
                  <div class="text-sm">
                    <span class="font-bold text-blue-600 block">Luar RW 09 / Eksternal</span>
                    <span class="text-xs text-gray-500">Pihak luar / umum</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Info Alert -->
            <div v-if="dataSource === 'MANUAL_ENTRY'" class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div class="flex items-start space-x-2">
                <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <div class="text-sm text-blue-700 dark:text-blue-300">
                  <p class="font-medium">Nasabah Eksternal</p>
                  <p class="text-xs mt-0.5">{{ customerType === 'GROUP' ? 'Kelompok dari RW/kelurahan lain. Silakan masukkan data manual.' : 'Warga dari RW/kelurahan lain. Silakan masukkan data manual.' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ======================================== -->
          <!-- GROUP REGISTRATION FORM -->
          <!-- ======================================== -->
          <div v-if="!isEditing && customerType === 'GROUP'">
            <!-- Nama Kelompok -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nama Kelompok *</label>
              <input
                v-model="groupForm.groupName"
                type="text"
                required
                placeholder="Contoh: Karang Taruna RW 09"
                class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>

            <!-- Tipe Organisasi -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipe Organisasi</label>
              <select v-model="groupForm.organizationType" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white">
                <option value="KARANG_TARUNA">Karang Taruna</option>
                <option value="RT">RT</option>
                <option value="PKK">PKK</option>
                <option value="REMAJA_MASJID">Remaja Masjid</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>

            <!-- Jumlah Anggota -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Jumlah Anggota</label>
              <input
                v-model.number="groupForm.totalMembers"
                type="number"
                min="0"
                placeholder="25"
                class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>

            <!-- PIC Section -->
            <div class="border-t pt-4 mt-4 border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-3">Penanggung Jawab (PIC)</h4>

              <!-- INTERNAL: NIK Search with Autocomplete -->
              <div v-if="dataSource === 'HOUSEHOLD_DB'">
                <div class="mb-4 relative">
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Cari NIK/Nama Warga *</label>
                  <input
                    v-model="nikSearchQuery"
                    @input="onNikSearch"
                    type="text"
                    required
                    placeholder="Ketik NIK atau nama..."
                    class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                    autocomplete="off"
                  />

                  <!-- Autocomplete Dropdown -->
                  <div
                    v-if="nikSuggestions.length > 0 || nikSearchLoading"
                    class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    <!-- Loading State -->
                    <div v-if="nikSearchLoading" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      Mencari...
                    </div>

                    <!-- Results -->
                    <button
                      v-for="member in nikSuggestions"
                      :key="member.nik"
                      type="button"
                      @click="selectNik(member)"
                      class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div class="font-medium text-gray-900 dark:text-white">
                        {{ member.name }}
                        <span class="text-xs text-blue-600 ml-1">({{ member.nik }})</span>
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {{ member.address || 'Alamat tidak tersedia' }}
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Auto-filled PIC Name -->
                <div class="mb-4">
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nama PIC</label>
                  <input
                    v-model="groupForm.picName"
                    type="text"
                    disabled
                    class="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500"
                  />
                </div>
              </div>

              <!-- EXTERNAL: Manual Entry -->
              <div v-else>
                <div class="mb-4">
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">NIK PIC (Opsional)</label>
                  <input
                    v-model="groupForm.picNik"
                    type="text"
                    placeholder="Contoh: 3273012345678901"
                    class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div class="mb-4">
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nama PIC *</label>
                  <input
                    v-model="groupForm.picName"
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <!-- PIC Role (Common) -->
              <div class="mb-4">
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Jabatan</label>
                <input
                  v-model="groupForm.picRole"
                  type="text"
                  placeholder="Ketua"
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>

              <!-- PIC Phone -->
              <div class="mb-4">
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">No. HP PIC *</label>
                <input
                  v-model="groupForm.picPhone"
                  type="tel"
                  required
                  placeholder="0812..."
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <!-- Location Info for External Groups -->
            <div v-if="dataSource === 'MANUAL_ENTRY'" class="border-t pt-4 mt-4 border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-3">Lokasi Kelompok</h4>

              <div class="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">RT *</label>
                  <input
                    v-model="form.rt"
                    type="text"
                    required
                    placeholder="001"
                    class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">RW *</label>
                  <input
                    v-model="form.rw"
                    type="text"
                    required
                    placeholder="005"
                    class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Alamat</label>
                <textarea
                  v-model="form.address"
                  rows="2"
                  placeholder="Alamat lengkap sekretariat..."
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Kelurahan</label>
                  <input
                    v-model="form.kelurahan"
                    type="text"
                    placeholder="Contoh: Baktijaya"
                    class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Kecamatan</label>
                  <input
                    v-model="form.kecamatan"
                    type="text"
                    placeholder="Contoh: Sukmajaya"
                    class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- ======================================== -->
          <!-- INDIVIDUAL REGISTRATION FORM -->
          <!-- ======================================== -->

          <!-- INTERNAL: Autocomplete Search -->
          <div v-if="!isEditing && customerType === 'INDIVIDUAL' && dataSource === 'HOUSEHOLD_DB'">
            <!-- READ ONLY Identity Info for Selected Resident -->
            <div v-if="form.nik" class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 mb-4">
              <h4 class="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">Identitas Warga Terpilih:</h4>
              <div class="text-sm text-gray-700 dark:text-gray-300 grid grid-cols-2 gap-2">
                <span>Nama:</span> <span class="font-medium">{{ form.name }}</span>
                <span>NIK:</span> <span class="font-medium">{{ form.nik }}</span>
                <span>Alamat:</span> <span>{{ form.address }}</span>
              </div>
            </div>

            <!-- SEARCH FIELD (Only visible when not yet selected) -->
            <div v-if="!form.nik" class="relative mb-4">
              <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Cari Warga (EcoBank) *</label>
              <input
                ref="nameInputRef"
                v-model="form.name"
                @input="debouncedHouseholdSearch"
                @focus="handleFocus"
                type="text"
                required
                placeholder="Ketik nama warga..."
                class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                autocomplete="off"
              />

              <!-- Autocomplete Dropdown -->
              <div
                v-if="showDropdown && (searchResults.length > 0 || isSearching)"
                class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                <div v-if="isSearching" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  Mencari...
                </div>
                <button
                  v-for="person in searchResults"
                  :key="`${person.household_id}-${person.name}`"
                  type="button"
                  @click="selectHousehold(person)"
                  class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ person.name }}
                    <span class="text-xs text-blue-600 ml-1">({{ person.nik }})</span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                     {{ person.alamat?.alamat || 'Alamat tidak tersedia' }}
                  </div>
                </button>
              </div>
            </div>

            <!-- LOGIN CREDENTIALS (Only for internal with NIK selected) -->
            <div v-if="form.nik" class="border-t pt-4 mt-4 border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-3">Buat Akun Login Nasabah</h4>
              <div class="grid grid-cols-1 gap-4">
                  <div>
                      <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Username *</label>
                      <input v-model="form.username" type="text" placeholder="Buat username unik" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white" required />
                  </div>
                  <div>
                      <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password *</label>
                      <input v-model="form.password" type="password" placeholder="Minimal 6 karakter" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white" required />
                  </div>
              </div>
            </div>
          </div>

          <!-- EXTERNAL: Manual Entry Form -->
          <div v-if="!isEditing && customerType === 'INDIVIDUAL'">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">NIK (Opsional)</label>
                <input
                  v-model="form.nik"
                  type="text"
                  placeholder="3273012345678901"
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nama Lengkap *</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="Budi Santoso"
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">No. Handphone *</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  required
                  placeholder="08123456789"
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Alamat Lengkap *</label>
                <textarea
                  v-model="form.address"
                  rows="2"
                  required
                  placeholder="Jl. Merdeka No. 10"
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    RT <span v-if="customerType === 'INDIVIDUAL'">(Wajib)</span><span v-else>(Opsional)</span>
                  </label>
                  <input
                    v-model="form.rt"
                    type="text"
                    :required="customerType === 'INDIVIDUAL'"
                    placeholder="001"
                    class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">RW *</label>
                  <input
                    v-model="form.rw"
                    type="text"
                    required
                    placeholder="005"
                    class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Kelurahan</label>
                  <input
                    v-model="form.kelurahan"
                    type="text"
                    placeholder="Baktijaya"
                    class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Kecamatan</label>
                  <input
                    v-model="form.kecamatan"
                    type="text"
                    placeholder="Sukmajaya"
                    class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- EDIT FORM (Existing customers) -->

           <!-- Standard Fields (Editable only if editing or manually overridable) -->
           <div v-if="isEditing" class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                <input v-model="form.name" type="text" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Wilayah</label>
                <select v-model="locality" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white">
                  <option value="INTERNAL">🏠 Internal RW 09</option>
                  <option value="EXTERNAL">🌐 Luar RW 09 / Eksternal</option>
                </select>
              </div>
           </div>
           <!-- Hide Address inputs for new reg as they are auto-filled, show for edit -->
           <div v-if="isEditing" class="grid grid-cols-2 gap-3">
              <!-- Address fields... -->
            </div>

        </div>
      </form>
      <div class="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex gap-3">
          <button
            type="button"
            @click="showModal = false"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            Batal
          </button>
          <button
            type="submit"
            @click="handleSubmit"
            :disabled="saving"
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</teleport>


</template>

<script setup>
import { inject } from 'vue';
import { Eye, FileText, Pencil, Plus, Trash2, X } from 'lucide-vue-next';
import { wasteBankCustomerContextKey } from './customerContext';

const {
  router,
  customers,
  loading,
  showModal,
  isEditing,
  selectedCustomer,
  saving,
  showPasswordForm,
  newPassword,
  changingPassword,
  showLinkAccountForm,
  linkAccountData,
  linkingAccount,
  isEditingInfo,
  editForm,
  savingInfo,
  editInfoError,
  searchQuery,
  pagination,
  filters,
  customerTypeOptions,
  showRtDropdown,
  showRwDropdown,
  rtDropdownRef,
  rwDropdownRef,
  closeFilterDropdowns,
  toggleRtDropdown,
  toggleRwDropdown,
  setCustomerTypeFilter,
  selectRt,
  selectRw,
  handlePageClickOutside,
  rtOptions,
  rwOptions,
  form,
  searchResults,
  isSearching,
  showDropdown,
  nameInputRef,
  customerType,
  dataSource,
  locality,
  groupForm,
  nikSearchQuery,
  nikSuggestions,
  nikSearchLoading,
  formatCurrency,
  formatAddress,
  debouncedSearch,
  debouncedHouseholdSearch,
  searchHouseholds,
  formatHouseholdAddress,
  handleChangePassword,
  handleLinkAccount,
  startEditInfo,
  cancelEditInfo,
  saveCustomerInfo,
  onNikSearch,
  selectNik,
  selectHousehold,
  handleFocus,
  handleClickOutside,
  fetchCustomers,
  openAddModal,
  openEditModal,
  handleSubmit,
  viewDetail,
  closeDetailModal,
  viewTransactions,
  confirmDelete,
  changePage
} = inject(wasteBankCustomerContextKey);
</script>
