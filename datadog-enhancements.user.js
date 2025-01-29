// ==UserScript==
// @name         DataDog Enhancements
// @namespace    com.azzo.datadog
// @version      2.0.0
// @downloadURL  https://github.com/AZZO/datadog-enhancements/raw/main/datadog-enhancements.user.js
// @updateURL    https://github.com/AZZO/datadog-enhancements/raw/main/datadog-enhancements.user.js
// @description  Add a drop-down to control columns and sync graph cursors
// @match        https://*.datadoghq.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=datadoghq.com
// @author       Luke Ballantyne + AI
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Column control variables
    let currentColumns = 1;
    let gridObserver;
    let menuObserver;

    // Cursor sync variables
    let activeGraph = null;
    let cursorSyncEnabled = true;

    // Column control functions
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

    // Cursor sync functions
    function updateAllCursors() {
        if (!cursorSyncEnabled || !activeGraph) return;

        const activeCursor = activeGraph.querySelector('.dataviz_plot-ts-cursor');
        if (!activeCursor) return;

        const transform = activeCursor.getAttribute('transform');
        if (!transform) return;

        const allCursors = document.querySelectorAll('.dataviz_plot-ts-cursor');
        allCursors.forEach(cursor => {
            if (cursor !== activeCursor) {
                cursor.setAttribute('transform', transform);
                cursor.style.visibility = 'visible';
            }
        });
    }

    function handleGraphMouseover(event) {
        if (!cursorSyncEnabled) return;
        const graphContainer = event.target.closest('[class*="graph"]');
        if (!graphContainer) return;
        activeGraph = graphContainer;
    }

    function handleGraphMouseout(event) {
        if (!cursorSyncEnabled) return;
        if (!event.relatedTarget?.closest('[class*="graph"]')) {
            activeGraph = null;
            const allCursors = document.querySelectorAll('.dataviz_plot-ts-cursor');
            allCursors.forEach(cursor => {
                cursor.style.visibility = 'hidden';
            });
        }
    }

    function createControls() {
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

        // Column Select wrapper
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'druids_form_select-wrapper druids_form_select-wrapper--is-multi-line';
        selectWrapper.style.position = 'relative';

        // Button and dropdown setup (unchanged from original)
        const button = document.createElement('button');
        button.className = 'Select druids_form_select druids_form_select--xs druids_form_select--is-borderless druids_form_select--has-arrow has-value is-searchable Select--single is-closed';
        button.type = 'button';
        button.setAttribute('aria-label', 'Columns');
        button.setAttribute('data-dd-action-name', 'Select');

        const controlDiv = document.createElement('div');
        controlDiv.className = 'Select-control';

        const valueWrapper = document.createElement('span');
        valueWrapper.className = 'Select-multi-value-wrapper';

        const valueDiv = document.createElement('div');
        valueDiv.className = 'Select-value';

        const valueLabel = document.createElement('span');
        valueLabel.className = 'Select-value-label';
        valueLabel.textContent = currentColumns;

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

        // Dropdown menu
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

            option.addEventListener('mouseover', () => option.style.backgroundColor = '#598acb');
            option.addEventListener('mouseout', () => option.style.backgroundColor = '#1d1c1f');

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

        // Add cursor sync toggle
        const toggleSwitch = document.createElement('button');
        toggleSwitch.className = 'druids_form_action druids_form_action--is-basic druids_form_toggle-switch druids_form_toggle-switch--xs druids_form_toggle-switch--is-interactive druids_margin--left-sm';
        toggleSwitch.setAttribute('type', 'button');
        toggleSwitch.setAttribute('role', 'checkbox');
        toggleSwitch.setAttribute('aria-checked', 'true');
        toggleSwitch.setAttribute('aria-readonly', 'false');

        toggleSwitch.innerHTML = `
            <div class="druids_form_thumb-and-track druids_form_thumb-and-track--xs">
                <input class="druids_form_thumb-and-track__input" type="checkbox" checked>
                <label class="druids_form_thumb-and-track__track">
                    <span class="druids_form_thumb-and-track__thumb druids_form_thumb-and-track__thumb--right"></span>
                </label>
            </div>
            <label class="druids_form_toggle-switch__label">Sync Cursors</label>
        `;

        toggleSwitch.addEventListener('click', () => {
            cursorSyncEnabled = !cursorSyncEnabled;
            toggleSwitch.setAttribute('aria-checked', cursorSyncEnabled.toString());
            const thumb = toggleSwitch.querySelector('.druids_form_thumb-and-track__thumb');
            thumb.className = `druids_form_thumb-and-track__thumb druids_form_thumb-and-track__thumb--${cursorSyncEnabled ? 'right' : 'left'}`;
            if (!cursorSyncEnabled) {
                const allCursors = document.querySelectorAll('.dataviz_plot-ts-cursor');
                allCursors.forEach(cursor => {
                    if (cursor.style.visibility === 'visible') {
                        cursor.style.visibility = 'hidden';
                    }
                });
            }
        });

        container.appendChild(toggleSwitch);

        // Insertion logic
        function insertControls() {
            const reverseToggle = document.querySelector('.druids_form_toggle-switch');
            if (!reverseToggle) return;

            if (document.querySelector('.dd-columns-selector')) return;

            const separator = document.createElement('div');
            separator.className = 'druids_margin--left-sm druids_margin--right-sm druids_layout_vertical-separator druids_layout_vertical-separator--md';

            reverseToggle.parentNode.insertBefore(container, reverseToggle.nextSibling);
            container.parentNode.insertBefore(separator, container);
            container.classList.add('dd-columns-selector');
        }

        menuObserver = new MutationObserver(() => {
            if (!document.querySelector('.dd-columns-selector')) {
                insertControls();
            }
        });

        menuObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        insertControls();
    }

    // Initialize graph event listeners
    function initGraphEvents() {
        const graphs = document.querySelectorAll('[class*="graph"]');
        graphs.forEach(graph => {
            graph.addEventListener('mouseover', handleGraphMouseover);
            graph.addEventListener('mouseout', handleGraphMouseout);
            graph.addEventListener('mousemove', updateAllCursors);
        });
    }

    // Initialize grid observer
    function initGridObserver() {
        gridObserver = new MutationObserver((mutations) => {
            checkAndApplyColumns();
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const graphs = node.querySelectorAll('[class*="graph"]');
                        graphs.forEach(graph => {
                            graph.addEventListener('mouseover', handleGraphMouseover);
                            graph.addEventListener('mouseout', handleGraphMouseout);
                            graph.addEventListener('mousemove', updateAllCursors);
                        });
                    }
                });
            });
        });

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
        createControls();
        initGraphEvents();
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
