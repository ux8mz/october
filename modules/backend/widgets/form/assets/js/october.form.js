/*
 * Form Widget
 *
 * Dependences:
 * - Nil
 */
+function ($) { "use strict";

    var FormWidget = function (element, options) {

        var $el = this.$el = $(element);

        this.$form = $el.closest('form')
        this.options = options || {};

        this.bindDependants()
        this.bindCheckboxlist()
        this.toggleEmptyTabs()
        this.bindCollapsibleSections()
    }

    FormWidget.DEFAULTS = {
        refreshHandler: null
    }

    /*
     * Logic for checkboxlist
     */
    FormWidget.prototype.bindCheckboxlist = function() {

        var checkAllBoxes = function($field, flag) {
            $('input[type=checkbox]', $field)
                .prop('checked', flag)
                .first()
                .trigger('change')
        }

        this.$el.on('click', '[data-field-checkboxlist-all]', function() {
            checkAllBoxes($(this).closest('.field-checkboxlist'), true)
        })

        this.$el.on('click', '[data-field-checkboxlist-none]', function() {
            checkAllBoxes($(this).closest('.field-checkboxlist'), false)
        })

    }

    /*
     * Bind dependant fields
     */
    FormWidget.prototype.bindDependants = function() {
        var self = this,
            form = this.$el,
            formEl = this.$form,
            fieldMap = {}

        /*
         * Map master and slave field map
         */
        form.find('[data-field-depends]').each(function(){
            var name = $(this).data('field-name'),
                depends = $(this).data('field-depends')

            $.each(depends, function(index, depend){
                if (!fieldMap[depend])
                    fieldMap[depend] = { fields: [] }

                fieldMap[depend].fields.push(name)
            })
        })

        /*
         * When a master is updated, refresh its slaves
         */
        $.each(fieldMap, function(fieldName, toRefresh){
            form.find('[data-field-name="'+fieldName+'"]')
                .on('change', 'select, input', function(){
                    formEl.request(self.options.refreshHandler, {
                        data: toRefresh
                    }).success(function(){
                        self.toggleEmptyTabs()
                    })

                    $.each(toRefresh.fields, function(index, field){
                        form.find('[data-field-name="'+field+'"]:visible')
                            .addClass('loading-indicator-container size-form-field')
                            .loadIndicator()
                    })
                })
        })
    }

    /*
     * Hides tabs that have no content
     */
    FormWidget.prototype.toggleEmptyTabs = function() {
        var tabControl = $('[data-control=tab]', this.$el)

        if (!tabControl.length)
            return

        $('.tab-pane', tabControl).each(function(){
            $('[data-target="#' + $(this).attr('id') + '"]', tabControl)
                .toggle(!!$('.form-group:not(:empty)', $(this)).length)
        })
    }

    /*
     * Makes sections collapsible by targeting every field after
     * up until the next section
     */
    FormWidget.prototype.bindCollapsibleSections = function() {
        $('.section-field[data-field-collapsible]', this.$form)
            .addClass('collapsed')
            .find('.field-section:first')
                .addClass('is-collapsible')
                .end()
            .on('click', function() {
                $(this)
                    .toggleClass('collapsed')
                    .nextUntil('.section-field').toggle()
            })
            .nextUntil('.section-field').hide()
    }

    // FORM WIDGET PLUGIN DEFINITION
    // ============================

    var old = $.fn.formWidget

    $.fn.formWidget = function (option) {
        var args = arguments,
            result

        this.each(function () {
            var $this   = $(this)
            var data    = $this.data('oc.formwidget')
            var options = $.extend({}, FormWidget.DEFAULTS, $this.data(), typeof option == 'object' && option)
            if (!data) $this.data('oc.formwidget', (data = new FormWidget(this, options)))
            if (typeof option == 'string') result = data[option].call($this)
            if (typeof result != 'undefined') return false
        })

        return result ? result : this
      }

    $.fn.formWidget.Constructor = FormWidget

    // FORM WIDGET NO CONFLICT
    // =================

    $.fn.formWidget.noConflict = function () {
        $.fn.formWidget = old
        return this
    }

    // FORM WIDGET DATA-API
    // ==============

    $(document).render(function(){
        $('[data-control="formwidget"]').formWidget();
    })

}(window.jQuery);