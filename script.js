// Global state
let currentView = 'products';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAllProducts();
    loadStatistics();
});

// Utility Functions
function showMessage(message, type = 'success') {
    const messageArea = document.getElementById('message-area');
    messageArea.innerHTML = `<div class="message message-${type}">${message}</div>`;
    setTimeout(() => {
        messageArea.innerHTML = '';
    }, 5000);
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// Modal Functions
function showAddProductModal() {
    document.getElementById('addProductForm').reset();
    showModal('addProductModal');
}

function showSearchModal() {
    document.getElementById('searchForm').reset();
    showModal('searchModal');
}

function showAddOrderModal() {
    document.getElementById('addOrderForm').reset();
    showModal('addOrderModal');
}

function showEditProductModal(product) {
    document.getElementById('editProductId').value = product.product_id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductQuantity').value = product.quantity;
    showModal('editProductModal');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

// API Functions - Products
async function loadAllProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success) {
            displayProducts(data.products);
            currentView = 'products';
            hideOtherViews('products-container');
        }
    } catch (error) {
        showMessage('Error loading products: ' + error.message, 'error');
    }
}

function displayProducts(products) {
    const container = document.getElementById('products-container');
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No products found</h3><p>Add your first product to get started!</p></div>';
        return;
    }
    
    container.innerHTML = '<div class="products-grid">' + products.map(product => `
        <div class="product-card">
            <h3>${escapeHtml(product.name)}</h3>
            <div class="product-info"><strong>ID:</strong> ${product.product_id}</div>
            <div class="product-info"><strong>Category:</strong> ${escapeHtml(product.category)}</div>
            <div class="product-info"><strong>Price:</strong> $${product.price.toFixed(2)}</div>
            <div class="product-info"><strong>Quantity:</strong> ${product.quantity}</div>
            <div class="product-actions">
                <button class="btn btn-primary btn-small" onclick="showEditProductModal(${JSON.stringify(product).replace(/"/g, '&quot;')})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteProduct(${product.product_id})">Delete</button>
            </div>
        </div>
    `).join('') + '</div>';
}

async function addProduct(event) {
    event.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        quantity: parseInt(document.getElementById('productQuantity').value)
    };
    
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Product added successfully!');
            closeModal('addProductModal');
            loadAllProducts();
            loadStatistics();
        } else {
            showMessage(data.error || 'Error adding product', 'error');
        }
    } catch (error) {
        showMessage('Error adding product: ' + error.message, 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Product deleted successfully!');
            loadAllProducts();
            loadStatistics();
        } else {
            showMessage(data.error || 'Error deleting product', 'error');
        }
    } catch (error) {
        showMessage('Error deleting product: ' + error.message, 'error');
    }
}

async function updateProduct(event) {
    event.preventDefault();
    
    const productId = parseInt(document.getElementById('editProductId').value);
    const price = parseFloat(document.getElementById('editProductPrice').value);
    const quantity = parseInt(document.getElementById('editProductQuantity').value);
    
    try {
        // Update price
        const priceResponse = await fetch(`/api/products/${productId}/price`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ price })
        });
        
        // Update quantity
        const quantityResponse = await fetch(`/api/products/${productId}/quantity`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity })
        });
        
        const priceData = await priceResponse.json();
        const quantityData = await quantityResponse.json();
        
        if (priceData.success && quantityData.success) {
            showMessage('Product updated successfully!');
            closeModal('editProductModal');
            loadAllProducts();
            loadStatistics();
        } else {
            showMessage(priceData.error || quantityData.error || 'Error updating product', 'error');
        }
    } catch (error) {
        showMessage('Error updating product: ' + error.message, 'error');
    }
}

async function searchProducts(event) {
    event.preventDefault();
    
    const name = document.getElementById('searchName').value;
    
    try {
        const response = await fetch(`/api/products/search?name=${encodeURIComponent(name)}`);
        const data = await response.json();
        
        if (data.success) {
            displayProducts(data.products);
            currentView = 'products';
            hideOtherViews('products-container');
            closeModal('searchModal');
            showMessage(`Found ${data.products.length} product(s)`);
        } else {
            showMessage(data.error || 'Error searching products', 'error');
        }
    } catch (error) {
        showMessage('Error searching products: ' + error.message, 'error');
    }
}

// API Functions - Orders
async function addOrder(event) {
    event.preventDefault();
    
    const orderData = {
        product_id: parseInt(document.getElementById('orderProductId').value),
        quantity: parseInt(document.getElementById('orderQuantity').value)
    };
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Order added to queue successfully!');
            closeModal('addOrderModal');
            loadPendingOrders();
            loadStatistics();
        } else {
            showMessage(data.error || 'Error adding order', 'error');
        }
    } catch (error) {
        showMessage('Error adding order: ' + error.message, 'error');
    }
}

async function processOrder() {
    try {
        const response = await fetch('/api/orders/process', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(`Order processed successfully! Product: ${data.order.product_name}, Quantity: ${data.order.quantity}, Total: $${data.order.total_price.toFixed(2)}`);
            loadPendingOrders();
            loadAllProducts();
            loadStatistics();
        } else {
            showMessage(data.error || 'No orders to process', 'error');
        }
    } catch (error) {
        showMessage('Error processing order: ' + error.message, 'error');
    }
}

async function loadPendingOrders() {
    try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        if (data.success) {
            displayOrders(data.orders);
            currentView = 'orders';
            hideOtherViews('orders-container');
        }
    } catch (error) {
        showMessage('Error loading orders: ' + error.message, 'error');
    }
}

function displayOrders(orders) {
    const container = document.getElementById('orders-container');
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No pending orders</h3><p>The order queue is empty.</p></div>';
        return;
    }
    
    container.innerHTML = '<h2>Pending Orders</h2><ul class="orders-list">' + orders.map(order => `
        <li class="order-item">
            <strong>Product:</strong> ${escapeHtml(order.product_name)}<br>
            <strong>Quantity:</strong> ${order.quantity}<br>
            <strong>Total Price:</strong> $${order.total_price.toFixed(2)}
        </li>
    `).join('') + '</ul>';
}

// API Functions - Operations
async function undoOperation() {
    try {
        const response = await fetch('/api/operations/undo', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Last operation undone successfully!');
            loadAllProducts();
            loadPendingOrders();
            loadStatistics();
        } else {
            showMessage(data.error || 'No operations to undo', 'error');
        }
    } catch (error) {
        showMessage('Error undoing operation: ' + error.message, 'error');
    }
}

async function loadRecentOperations() {
    try {
        const response = await fetch('/api/operations/recent?n=10');
        const data = await response.json();
        
        if (data.success) {
            displayOperations(data.operations);
            currentView = 'operations';
            hideOtherViews('operations-container');
        }
    } catch (error) {
        showMessage('Error loading operations: ' + error.message, 'error');
    }
}

function displayOperations(operations) {
    const container = document.getElementById('operations-container');
    
    if (operations.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No recent operations</h3><p>Operations will appear here as you use the system.</p></div>';
        return;
    }
    
    container.innerHTML = '<h2>Recent Operations</h2><ul class="operations-list">' + operations.map(op => `
        <li class="operation-item">
            <strong>${op.type.toUpperCase()}:</strong> ${escapeHtml(op.description)}
        </li>
    `).join('') + '</ul>';
}

// API Functions - Statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/statistics');
        const data = await response.json();
        
        if (data.success) {
            updateStatsBar(data.statistics);
            displayStatistics(data.statistics);
        }
    } catch (error) {
        showMessage('Error loading statistics: ' + error.message, 'error');
    }
}

function updateStatsBar(stats) {
    document.getElementById('stat-total-products').textContent = stats.total_products;
    document.getElementById('stat-total-quantity').textContent = stats.total_quantity;
    document.getElementById('stat-total-value').textContent = '$' + stats.total_value.toFixed(2);
    document.getElementById('stat-categories').textContent = stats.categories;
    document.getElementById('stat-pending-orders').textContent = stats.pending_orders;
}

function displayStatistics(stats) {
    const container = document.getElementById('statistics-container');
    
    container.innerHTML = `
        <h2>Inventory Statistics</h2>
        <div class="statistics-grid">
            <div class="statistics-item">
                <h3>Total Products</h3>
                <p>${stats.total_products}</p>
            </div>
            <div class="statistics-item">
                <h3>Total Quantity</h3>
                <p>${stats.total_quantity}</p>
            </div>
            <div class="statistics-item">
                <h3>Total Inventory Value</h3>
                <p>$${stats.total_value.toFixed(2)}</p>
            </div>
            <div class="statistics-item">
                <h3>Categories</h3>
                <p>${stats.categories}</p>
            </div>
            <div class="statistics-item">
                <h3>Pending Orders</h3>
                <p>${stats.pending_orders}</p>
            </div>
        </div>
    `;
}

// Utility Functions
function hideOtherViews(activeView) {
    const views = ['products-container', 'orders-container', 'operations-container', 'statistics-container'];
    views.forEach(view => {
        if (view !== activeView) {
            document.getElementById(view).innerHTML = '';
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

