// ==UserScript==
// @name         DataDog Enhancements
// @namespace    com.azzo.datadog
// @version      1.0.0
// @downloadURL  https://github.com/AZZO/timeslice-colourifier/raw/main/datadog-enhancements.user.js
// @updateURL    https://github.com/AZZO/timeslice-colourifier/raw/main/datadog-enhancements.user.js
// @description  Add a drop-down to control the number of columns (1-10) on Datadog's Metric Explorer
// @match        https://*.datadoghq.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=datadoghq.com
// @author       Luke Ballantyne + AI
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let currentColumns = 1;
    let gridObserver;
    let menuObserver;

    function updateColumns(count) {
        const gridElement = document.querySelector('.druids_layout_grid.druids_margin--top-lg.druids_margin--bottom-lg');
        if (gridElement) {
            gridElement.style.setProperty('--grid-columns-count', count);
        }
    }

    function checkAndApplyColumns() {
        const gridElement = document.querySelector('.druids_layout_grid.druids_margin--top-lg.druids_margin--bottom-lg');
        if (gridElement) {
            updateColumns(currentColumns);
        }
    }

    function createColumnDropdown() {
        const container = document.createElement('span');
        container.className = 'druids_layout_flex druids_layout_flex--direction-row druids_layout_flex--align-items-center druids_layout_flex--justify-flex-start druids_layout_flex--wrap-nowrap druids_layout_flex--is-inline druids_layout_flex--has-legacy-gap';

        // Label
        const label = document.createElement('label');
        label.className = 'druids_form_label druids_form_label--xs';
        const labelSpan = document.createElement('span');
        labelSpan.className = 'druids_typography_text druids_typography_text--secondary druids_typography_text--normal druids_typography_text--left';
        labelSpan.textContent = 'Columns:';
        label.appendChild(labelSpan);
        container.appendChild(label);

        // Select wrapper
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'druids_form_select-wrapper druids_form_select-wrapper--is-multi-line';
        selectWrapper.style.position = 'relative';

        // Native-style button
        const button = document.createElement('button');
        button.className = 'Select druids_form_select druids_form_select--xs druids_form_select--is-borderless druids_form_select--has-arrow has-value is-searchable Select--single is-closed';
        button.type = 'button';
        button.setAttribute('aria-label', 'Columns');
        button.setAttribute('data-dd-action-name', 'Select');

        // Button inner structure
        const controlDiv = document.createElement('div');
        controlDiv.className = 'Select-control';

        const valueWrapper = document.createElement('span');
        valueWrapper.className = 'Select-multi-value-wrapper';

        const valueDiv = document.createElement('div');
        valueDiv.className = 'Select-value';

        const valueLabel = document.createElement('span');
        valueLabel.className = 'Select-value-label';
        valueLabel.textContent = currentColumns;

        // Native-style arrow
        const arrowZone = document.createElement('span');
        arrowZone.className = 'Select-arrow-zone';
        arrowZone.innerHTML = `
            <svg class="druids_icons_icon druids_icons_icon--xs druids_icons_icon--is-scaled-down druids_form_select__arrow-icon" aria-hidden="true">
                <use xlink:href="#druids_icons_caret-down--sprite"></use>
            </svg>
        `;

        // Assemble button
        valueDiv.appendChild(valueLabel);
        valueWrapper.appendChild(valueDiv);
        controlDiv.appendChild(valueWrapper);
        controlDiv.appendChild(arrowZone);
        button.appendChild(controlDiv);

        // Custom dropdown menu
        const dropdownMenu = document.createElement('div');
        Object.assign(dropdownMenu.style, {
            display: 'none',
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#1d1c1f',
            border: '1px solid #598acb',
            borderRadius: '5px',
            marginTop: '4px',
            zIndex: '99999',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            color: 'white',
            overflow: 'hidden'
        });

        // Add options
        for (let i = 1; i <= 9; i++) {
            const option = document.createElement('div');
            option.textContent = i;
            Object.assign(option.style, {
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: '#1d1c1f',
                fontSize: '13px',
                color: 'white',
                transition: 'background-color 0.2s ease'
            });

            option.addEventListener('mouseover', () => {
                option.style.backgroundColor = '#598acb';
            });
            option.addEventListener('mouseout', () => {
                option.style.backgroundColor = '#1d1c1f';
            });

            option.addEventListener('click', () => {
                currentColumns = i;
                valueLabel.textContent = i;
                checkAndApplyColumns();
                dropdownMenu.style.display = 'none';
                button.classList.remove('is-open');
            });

            dropdownMenu.appendChild(option);
        }

        // Toggle dropdown
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdownMenu.style.display === 'block';
            dropdownMenu.style.display = isOpen ? 'none' : 'block';
            button.classList.toggle('is-open', !isOpen);
        });

        // Close on outside click
        document.addEventListener('click', () => {
            dropdownMenu.style.display = 'none';
            button.classList.remove('is-open');
        });

        selectWrapper.appendChild(button);
        selectWrapper.appendChild(dropdownMenu);
        container.appendChild(selectWrapper);

        // Robust insertion logic
        function insertDropdown() {
            const reverseToggle = document.querySelector('.druids_form_toggle-switch');
            if (!reverseToggle) return;

            if (document.querySelector('.dd-columns-selector')) return;

            const separator = document.createElement('div');
            separator.className = 'druids_margin--left-sm druids_margin--right-sm druids_layout_vertical-separator druids_layout_vertical-separator--md';

            reverseToggle.parentNode.insertBefore(container, reverseToggle.nextSibling);
            container.parentNode.insertBefore(separator, container);
            container.classList.add('dd-columns-selector');
        }

        // Menu observer for dynamic UI changes
        menuObserver = new MutationObserver(() => {
            if (!document.querySelector('.dd-columns-selector')) {
                insertDropdown();
            }
        });

        menuObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial insertion
        insertDropdown();
    }

    // Initialize grid observer
    function initGridObserver() {
        gridObserver = new MutationObserver(checkAndApplyColumns);
        gridObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        checkAndApplyColumns();
    }

    // Cleanup observers
    function cleanupObservers() {
        if (gridObserver) gridObserver.disconnect();
        if (menuObserver) menuObserver.disconnect();
    }

    // Initialize everything
    function init() {
        cleanupObservers();
        createColumnDropdown();
        initGridObserver();
    }

    // Start when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Reinitialize when navigation occurs
    window.addEventListener('spa:page-changed', init);
})();
